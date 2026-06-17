// Builds public/rag-index.json: chunks every lesson in content/lessons/ and
// embeds each chunk via a local Ollama embedding model.
//
// Usage: npm run rag:build
// Requires Ollama running locally with the embedding model pulled
// (default: nomic-embed-text).

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const LESSONS_DIR = path.resolve('content/lessons');
const OUTPUT_FILE = path.resolve('public/rag-index.json');
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBED_MODEL = process.env.EMBED_MODEL || 'nomic-embed-text';

// money-basics/ is a superseded draft folder (replaced by series-1/) that
// isn't referenced by src/lib/lessons.ts at all — skip it so the AI doesn't
// cite lessons that don't actually exist in the app's lesson browser.
const SKIP_DIRS = new Set(['money-basics']);

function walkMarkdownFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdownFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') out.push(full);
  }
  return out;
}

// Splits a lesson body into chunks on "## " headings. The top-level "# Title"
// line is dropped (it's already in frontmatter as `title`).
function chunkBody(body) {
  const chunks = [];
  let current = { heading: null, lines: [] };
  for (const line of body.split('\n')) {
    if (line.startsWith('## ')) {
      if (current.lines.join('\n').trim()) chunks.push(current);
      current = { heading: line.replace(/^##\s+/, '').trim(), lines: [] };
    } else if (line.startsWith('# ')) {
      continue;
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.join('\n').trim()) chunks.push(current);
  return chunks;
}

async function embed(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });
  if (!res.ok) {
    throw new Error(`Ollama embeddings request failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.embedding;
}

async function main() {
  const files = walkMarkdownFiles(LESSONS_DIR);
  const index = [];

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    const { data: meta, content } = matter(raw);
    const chunks = chunkBody(content);

    for (const chunk of chunks) {
      const text = chunk.lines.join('\n').trim();
      if (!text) continue;

      const embedInput = [meta.title, chunk.heading, text].filter(Boolean).join('\n\n');
      process.stdout.write(`Embedding: ${meta.series}/${path.basename(file, '.md')} — ${chunk.heading ?? '(intro)'}\n`);
      const embedding = await embed(embedInput);

      index.push({
        id: `${meta.series}/${path.basename(file, '.md')}#${chunk.heading ?? 'intro'}`,
        series: meta.series,
        module: meta.module,
        title: meta.title,
        readTime: meta.readTime,
        premium: !!meta.premium,
        tags: meta.tags ?? [],
        heading: chunk.heading,
        text,
        embedding,
      });
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`\nWrote ${index.length} chunks from ${files.length} lessons to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

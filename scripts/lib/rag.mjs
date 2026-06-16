// Shared retrieval helpers over content/rag-index.json.

import fs from 'node:fs';
import path from 'node:path';

const INDEX_FILE = path.resolve('public/rag-index.json');
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBED_MODEL = process.env.EMBED_MODEL || 'nomic-embed-text';

export async function embed(text) {
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

export function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function loadIndex() {
  if (!fs.existsSync(INDEX_FILE)) {
    throw new Error(`No index found at ${path.relative(process.cwd(), INDEX_FILE)} — run "npm run rag:build" first.`);
  }
  return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
}

export async function retrieve(query, topK = 4) {
  const index = loadIndex();
  const queryEmbedding = await embed(query);
  return index
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

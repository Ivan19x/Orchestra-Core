// Ask Orchestra-Core — end-to-end RAG chat over the local lesson corpus.
//
// Usage: npm run ask -- "your question here"
// Requires Ollama running locally with the chat model pulled (default: qwen2.5:7b)
// and public/rag-index.json built (npm run rag:build).

import fs from 'node:fs';
import path from 'node:path';
import { retrieve } from './lib/rag.mjs';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const CHAT_MODEL = process.env.CHAT_MODEL || 'qwen2.5:7b';
const TOP_K = Number(process.env.TOP_K || 4);

function loadSystemPrompt() {
  const raw = fs.readFileSync(path.resolve('content/system-prompt.md'), 'utf8');
  const heading = '## System prompt';
  const headingIndex = raw.indexOf(heading);
  if (headingIndex === -1) throw new Error('Could not find "## System prompt" section in content/system-prompt.md');

  const afterHeading = raw.slice(headingIndex + heading.length);
  const fenceStart = afterHeading.indexOf('```');
  const afterFenceStart = afterHeading.slice(fenceStart + 3);
  const fenceEnd = afterFenceStart.indexOf('```');
  return afterFenceStart.slice(0, fenceEnd).trim();
}

function formatContext(results) {
  return results
    .map(({ chunk }) => `### ${chunk.title} — ${chunk.heading ?? 'Overview'} (${chunk.series}, ${chunk.module})\n${chunk.text}`)
    .join('\n\n---\n\n');
}

async function main() {
  const question = process.argv.slice(2).join(' ');
  if (!question) {
    console.error('Usage: npm run ask -- "your question here"');
    process.exit(1);
  }

  const systemPrompt = loadSystemPrompt();
  const results = await retrieve(question, TOP_K);
  const context = formatContext(results);

  console.error('Retrieved:');
  for (const { chunk, score } of results) {
    console.error(`  [${score.toFixed(3)}] ${chunk.title} — ${chunk.heading ?? '(intro)'}`);
  }
  console.error('');

  const messages = [
    { role: 'system', content: `${systemPrompt}\n\n## Relevant lesson excerpts for this question\n\n${context}` },
    { role: 'user', content: question },
  ];

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: CHAT_MODEL, messages, stream: true }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Ollama chat request failed (${res.status}): ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;
      const chunk = JSON.parse(line);
      if (chunk.message?.content) process.stdout.write(chunk.message.content);
      if (chunk.done) process.stdout.write('\n');
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

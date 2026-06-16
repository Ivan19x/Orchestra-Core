// Quick CLI to test retrieval over content/rag-index.json.
//
// Usage: npm run rag:query -- "what is fuliza"

import { retrieve } from './lib/rag.mjs';

const TOP_K = Number(process.env.TOP_K || 4);

async function main() {
  const query = process.argv.slice(2).join(' ');
  if (!query) {
    console.error('Usage: npm run rag:query -- "your question here"');
    process.exit(1);
  }

  const ranked = await retrieve(query, TOP_K);

  console.log(`\nTop ${TOP_K} results for: "${query}"\n`);
  for (const { chunk, score } of ranked) {
    const tag = chunk.premium ? ', premium' : '';
    console.log(`[${score.toFixed(3)}] ${chunk.title} — ${chunk.heading ?? '(intro)'} (${chunk.series}, ${chunk.module}${tag})`);
    console.log(`        ${chunk.text.slice(0, 140).replace(/\n/g, ' ')}...\n`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

// Browser-side client for "Ask Orchestra-Core": retrieval over the local
// lesson index + streaming chat via a local Ollama instance.
//
// Keep this in sync with content/system-prompt.md (source of truth for the
// prompt) and scripts/ask.mjs (the CLI equivalent of this same pipeline).

const OLLAMA_URL = 'http://localhost:11434';
const RESEARCH_URL = 'http://localhost:5175';
const EMBED_MODEL = 'nomic-embed-text';
const CHAT_MODEL = 'qwen2.5:7b';

export const SYSTEM_PROMPT = `You are Orchestra-Core, a private AI financial literacy coach. You run locally on the
user's device — nothing they tell you leaves their machine.

## Your purpose
You teach people how money, markets, behavioral finance, and the institutions that
move markets actually work. You are a coach and explainer, not an advisor. Your job
is to help someone build their own understanding well enough to make their own
decisions — never to make decisions for them.

## Your voice
- Plain language first. If you must use a financial term (e.g. "amortization",
  "13F", "ROE"), define it in the same breath, simply, the first time you use it.
- Warm, patient, and a little Socratic: where it helps, ask a short question back
  before explaining, to connect the concept to the user's own situation
  ("What does your monthly budget currently look like?" rather than launching
  straight into theory).
- Concise by default. Give a clear, useful answer first; offer to go deeper rather
  than always dumping everything you know.
- Kenyan context by default. Use KES amounts, M-Pesa, SACCOs, NSE, payslips (PAYE,
  NSSF, SHIF, Housing Levy), and similar local examples unless the user signals
  they're asking about a different country.

## Grounding
You have access to a curated lesson library (Money Basics, Smart Money, Kenya
Money). When a question relates to a lesson topic, ground your answer in that
content and feel free to point the user to the relevant lesson by name/module
("This connects to Money Basics, Module 2 — want the full lesson?"). If retrieved
content conflicts with something you "know" generally, prefer the retrieved
content — it's been written and reviewed for this app.

## Web research (Deep Dive)
Sometimes you'll be given a "Web research" section with excerpts fetched live
from the web for this specific question (only when the user turns on Deep Dive).
When it's present:
- Use it — it's more current than your training data.
- Cite sources by name (and URL if useful) so the user can verify.
- Flag anything time-sensitive (rates, prices, dates) as reflecting what the
  source said at fetch time, not a live feed.
- The education-not-advice line still applies regardless of how current the
  information is.

## The line you do not cross
You provide EDUCATION, not personalized financial advice. Concretely:
- You explain how things work, how to think about a decision, and what factors
  matter — you do not tell a specific person what to buy, sell, borrow, or do with
  their specific money.
- If asked something like "should I buy shares in X" or "should I take this loan",
  reframe toward the factors that matter and how to think through them, rather
  than answering "yes" or "no". You can absolutely discuss how a type of decision
  is generally evaluated.
- "Smart Money" content (13F filings, hedge fund strategies, market-mover
  psychology) is always framed as "here's how to understand this" — never as a
  signal, tip, or recommendation to act on. Never imply that copying a famous
  investor's disclosed position is a strategy.
- If a user seems to be in financial distress (overwhelming debt, considering a
  risky loan to cover another loan, etc.), respond with empathy, stick to
  education about their options and how to think about them, and gently suggest
  speaking to their SACCO, employer HR/welfare desk, or a licensed advisor for
  anything that requires personalized advice.

## Closing reminder
End responses that touch on investing, borrowing, or "what should I do with my
money" type questions with a short, natural reminder that this is general
education, not personalized advice — vary the phrasing, don't repeat the same
sentence every time. Pure how-to-read-my-payslip or definitional questions don't
need it every single time — use judgment, but when in doubt, include it.

## What you don't do
- Don't invent specific current numbers (tax rates, fees, interest rates, share
  prices) — these change. If asked, explain the structure/how it works and note
  that the user should check the current figure from the authoritative source
  (KRA, their payslip, their bank/SACCO/broker, CBK's DhowCSD, etc.).
- Don't pretend to have live market data, news, or real-time prices — unless a
  "Web research" section has been provided for this question, in which case use
  and cite it.
- Don't reproduce long verbatim passages from books or articles — explain ideas in
  your own words.`;

export interface RagChunk {
  id: string;
  series: string;
  module: string;
  title: string;
  readTime: string;
  premium: boolean;
  tags: string[];
  heading: string | null;
  text: string;
  embedding: number[];
}

export interface RetrievedChunk {
  chunk: RagChunk;
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface WebSource {
  title: string;
  url: string;
  content: string;
}

export interface AskOptions {
  deepDive?: boolean;
  onStatus?: (status: string) => void;
}

export interface AskResult {
  lessonSources: RetrievedChunk[];
  webSources: WebSource[];
}

let cachedIndex: RagChunk[] | null = null;

async function loadIndex(): Promise<RagChunk[]> {
  if (cachedIndex) return cachedIndex;
  const res = await fetch('/rag-index.json');
  if (!res.ok) throw new Error('Could not load the lesson index (run `npm run rag:build`).');
  cachedIndex = await res.json();
  return cachedIndex as RagChunk[];
}

async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });
  if (!res.ok) throw new Error(`Ollama embeddings request failed (${res.status}).`);
  const data = await res.json();
  return data.embedding as number[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function retrieve(query: string, topK = 4): Promise<RetrievedChunk[]> {
  const index = await loadIndex();
  const queryEmbedding = await embed(query);
  return index
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function formatContext(results: RetrievedChunk[]): string {
  return results
    .map(({ chunk }) => `### ${chunk.title} — ${chunk.heading ?? 'Overview'} (${chunk.series}, ${chunk.module})\n${chunk.text}`)
    .join('\n\n---\n\n');
}

function formatWebContext(sources: WebSource[]): string {
  return sources
    .map(({ title, url, content }) => `### ${title}\n${url}\n${content}`)
    .join('\n\n---\n\n');
}

/**
 * Asks the local research server (server/index.mjs) to search the web and
 * fetch the top results. Returns [] if the server isn't running or the
 * search fails — Deep Dive degrades gracefully rather than blocking the chat.
 */
export async function deepSearch(query: string): Promise<WebSource[]> {
  try {
    const res = await fetch(`${RESEARCH_URL}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []) as WebSource[];
  } catch {
    return [];
  }
}

/**
 * Streams an "Ask Orchestra-Core" response for `question`, given prior
 * conversation `history`. Calls `onToken` for each chunk of text as it
 * arrives. Returns the retrieved lesson chunks and (if Deep Dive is on) web
 * sources, for citing in the UI.
 */
export async function askOrchestraCore(
  question: string,
  history: ChatMessage[],
  onToken: (token: string) => void,
  options: AskOptions = {},
): Promise<AskResult> {
  const { deepDive = false, onStatus } = options;

  onStatus?.('Searching the lesson library…');
  const results = await retrieve(question);
  const context = formatContext(results);

  let webSources: WebSource[] = [];
  let webContext = '';
  if (deepDive) {
    onStatus?.('Searching the web…');
    webSources = await deepSearch(question);
    if (webSources.length > 0) {
      onStatus?.(`Reading ${webSources.length} source${webSources.length === 1 ? '' : 's'}…`);
      webContext = `\n\n## Web research for this question\n\n${formatWebContext(webSources)}`;
    }
  }

  onStatus?.('Thinking…');

  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n## Relevant lesson excerpts for this question\n\n${context}${webContext}` },
    ...history,
    { role: 'user', content: question },
  ];

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: CHAT_MODEL, messages, stream: true }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Ollama chat request failed (${res.status}). Is Ollama running?`);
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
      const parsed = JSON.parse(line);
      if (parsed.message?.content) onToken(parsed.message.content);
    }
  }

  return { lessonSources: results, webSources };
}

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
The lessons are the course — they're where someone reads and learns a topic properly,
like chapters in a book. You are not a replacement for that reading. Your job is to:
1. **Explain further** — go deeper on a lesson topic, answer follow-up questions,
   give more examples, or rephrase something that didn't land the first time.
2. **Research** — when a question needs current information you don't have (today's
   exchange rate, a specific company's latest filing, a recent news event), use your
   web_search and web_fetch tools to find it, rather than guessing or relying only on
   what you already know.
3. **Help with practical account setup** — when someone wants to actually open an
   M-Pesa account, join a SACCO, open a bank or brokerage account, register for a
   CDS account to buy T-Bills, etc., walk them through the real steps, requirements,
   and documents needed. This is practical guidance, not personalized investment
   advice — you're explaining the process anyone in their situation would follow,
   not telling them whether to do it.

You are a coach and explainer, not an advisor. Your job is to help someone build
their own understanding well enough to make their own decisions — never to make
decisions for them.

## Languages
Respond in Kiswahili when the user writes to you in Kiswahili (or Sheng), and in
English when they write in English. Match their language naturally — don't switch
languages mid-response unless they do, and don't announce the switch.

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

## Web research (tools)
You have two tools:
- web_search(query) — searches the web, returns the top results (title, snippet, link).
- web_fetch(url) — opens a specific URL and returns the page's full text content.

Use them whenever a question depends on something that changes over time or that
you can't be confident about from training data alone: current exchange rates,
today's prices, a specific recent filing or news event, a SACCO's current interest
rate, etc. Search first to find the right source, then fetch a specific URL if you
need more than the snippet gives you. When you use them:
- Cite sources by name (and URL) so the user can verify.
- Flag anything time-sensitive (rates, prices, dates) as reflecting what the
  source said at fetch time, not a live feed.
- The education-not-advice line still applies regardless of how current the
  information is.
- Don't search for things you already confidently know (e.g. how compound
  interest works) — only reach for the tools when freshness or a specific current
  fact actually matters.

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
- Don't pretend to have live market data, news, or real-time prices from memory —
  use web_search/web_fetch to actually check, and cite what you find.
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

// ── Tool definitions handed to Ollama so the model can decide for itself
// whether a question needs live web information, rather than a manual
// "search before every message" toggle. Only attached when Deep Dive is on.
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for a query. Returns the top results: title, snippet, and link for each. Use this to find sources before reading one in full.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'The search query.' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_fetch',
      description: 'Open a specific URL and return its full page text content (not just a snippet). Use this after web_search to read a promising result in full.',
      parameters: {
        type: 'object',
        properties: { url: { type: 'string', description: 'The exact URL to fetch.' } },
        required: ['url'],
      },
    },
  },
];

interface ToolCall {
  function: { name: string; arguments: Record<string, unknown> | string };
}

interface SearchResult { title: string; url: string; snippet: string }

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    if (name === 'web_search') {
      const res = await fetch(`${RESEARCH_URL}/api/web-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: args.query, maxResults: 10 }),
      });
      if (!res.ok) return { error: `Search failed (${res.status})` };
      return await res.json();
    }
    if (name === 'web_fetch') {
      const res = await fetch(`${RESEARCH_URL}/api/web-fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: args.url }),
      });
      if (!res.ok) return { error: `Fetch failed (${res.status})` };
      return await res.json();
    }
    return { error: `Unknown tool "${name}"` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Tool call failed — the local research server may not be running.' };
  }
}

const MAX_TOOL_ROUNDS = 3;

/**
 * Streams an "Ask Orchestra-Core" response for `question`, given prior
 * conversation `history`. Calls `onToken` for each chunk of visible text as
 * it arrives. When Deep Dive is on, the model can call web_search/web_fetch
 * itself (rather than always searching first) — returns whichever pages it
 * actually chose to read, for citing in the UI.
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

  onStatus?.('Thinking…');

  const messages: Array<Record<string, unknown>> = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n## Relevant lesson excerpts for this question\n\n${context}` },
    ...history,
    { role: 'user', content: question },
  ];

  const webSources: WebSource[] = [];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const allowTools = deepDive && round < MAX_TOOL_ROUNDS;

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages,
        stream: true,
        ...(allowTools ? { tools: TOOLS } : {}),
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Ollama chat request failed (${res.status}). Is Ollama running?`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let assistantContent = '';
    let toolCalls: ToolCall[] = [];

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
        if (parsed.message?.tool_calls?.length) toolCalls = parsed.message.tool_calls;
        if (parsed.message?.content) {
          assistantContent += parsed.message.content;
          // Don't stream a tool-call turn's content to the UI — it's usually
          // empty or a "let me check" aside, not the real answer.
          if (!toolCalls.length) onToken(parsed.message.content);
        }
      }
    }

    if (toolCalls.length === 0) {
      return { lessonSources: results, webSources };
    }

    onStatus?.('Searching the web…');
    messages.push({ role: 'assistant', content: assistantContent, tool_calls: toolCalls });

    for (const call of toolCalls) {
      const name = call.function?.name;
      const rawArgs = call.function?.arguments;
      const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : (rawArgs ?? {});
      const result = await callTool(name, args);

      if (name === 'web_fetch' && result && typeof result === 'object' && 'content' in result) {
        const { url, title, content } = result as { url: string; title?: string; content: string };
        if (content) webSources.push({ title: title || url, url, content });
      }
      if (name === 'web_search' && result && typeof result === 'object' && 'results' in result) {
        onStatus?.(`Found ${((result as { results: SearchResult[] }).results ?? []).length} results…`);
      }

      messages.push({ role: 'tool', content: JSON.stringify(result) });
    }
  }

  return { lessonSources: results, webSources };
}

// Tiny local research server for Orchestra-Core's AI tools.
//
// The browser can't fetch arbitrary websites directly (CORS), so this server
// does it on the app's behalf: search the web, or fetch a specific page,
// strip it down to plain text, and hand that back for the chat model to read.
//
// Usage: npm run server  (listens on http://localhost:5175)

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5175;
const USER_AGENT = 'Mozilla/5.0 (compatible; OrchestraCoreResearch/1.0)';
const FETCH_TIMEOUT_MS = 8000;
const SEARCH_SNIPPET_RESULTS = 10; // web_search tool: titles/snippets/links only
const COMBINED_SEARCH_RESULTS = 4; // legacy /api/search: search + fetch combined
const COMBINED_FETCH_MAX_CHARS = 2000;
const FULL_FETCH_MAX_CHARS = 8000; // web_fetch tool: a full page read, still capped

// Searches DuckDuckGo's HTML results page and returns title + snippet + link
// for each hit, without fetching the pages themselves — this is the
// web_search tool: fast, cheap, lets the model decide whether to dig deeper.
async function searchDuckDuckGo(query, maxResults) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Search request failed (${res.status})`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const results = [];

  $('.result').each((_, el) => {
    if (results.length >= maxResults) return;
    const titleEl = $(el).find('.result__a').first();
    const title = titleEl.text().trim();
    let href = titleEl.attr('href') || '';
    // DuckDuckGo's HTML results wrap real URLs in a redirect link — unwrap it.
    const match = href.match(/uddg=([^&]+)/);
    if (match) href = decodeURIComponent(match[1]);
    const snippet = $(el).find('.result__snippet').first().text().trim();
    if (title && href.startsWith('http')) results.push({ title, url: href, snippet });
  });

  return results;
}

function extractText($) {
  $('script, style, nav, header, footer, noscript, svg').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

async function fetchPageText(url, maxChars) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const title = $('title').first().text().trim() || url;
  return { title, content: extractText($).slice(0, maxChars) };
}

// ── web_search tool: query -> top results (title, snippet, link) ───────────
app.post('/api/web-search', async (req, res) => {
  const { query, maxResults } = req.body ?? {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing "query" in request body.' });
  }
  try {
    const results = await searchDuckDuckGo(query, maxResults || SEARCH_SNIPPET_RESULTS);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── web_fetch tool: url -> full page text ────────────────────────────────────
app.post('/api/web-fetch', async (req, res) => {
  const { url } = req.body ?? {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing "url" in request body.' });
  }
  try {
    const { title, content } = await fetchPageText(url, FULL_FETCH_MAX_CHARS);
    res.json({ url, title, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Legacy combined search+fetch endpoint (kept for the CLI scripts) ────────
app.post('/api/search', async (req, res) => {
  const { query } = req.body ?? {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing "query" in request body.' });
  }

  try {
    const results = await searchDuckDuckGo(query, COMBINED_SEARCH_RESULTS);
    const enriched = await Promise.all(
      results.map(async (r) => {
        try {
          const { content } = await fetchPageText(r.url, COMBINED_FETCH_MAX_CHARS);
          return { ...r, content };
        } catch {
          return { ...r, content: '' };
        }
      })
    );
    res.json({ results: enriched.filter((r) => r.content) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// In the packaged app, this server also hosts the built frontend (`dist/`),
// so the whole app is reachable from a single local origin. In dev, `dist/`
// doesn't exist — Vite serves the frontend separately, and this only handles
// /api routes.
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Orchestra-Core server running at http://localhost:${PORT}`);
});

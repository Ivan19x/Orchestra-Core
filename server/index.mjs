// Tiny local research server for Orchestra-Core's "Deep Dive" feature.
//
// The browser can't fetch arbitrary websites directly (CORS), so this server
// does it on the app's behalf: search the web, fetch the top results, strip
// them down to plain text, and hand that back for the chat model to read.
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
const MAX_RESULTS = 4;
const MAX_CONTENT_CHARS = 2000;
const USER_AGENT = 'Mozilla/5.0 (compatible; OrchestraCoreResearch/1.0)';
const FETCH_TIMEOUT_MS = 8000;

async function searchDuckDuckGo(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Search request failed (${res.status})`);

  const html = await res.text();
  const $ = cheerio.load(html);
  const results = [];

  $('.result__a').each((_, el) => {
    if (results.length >= MAX_RESULTS) return;
    const title = $(el).text().trim();
    let href = $(el).attr('href') || '';
    // DuckDuckGo's HTML results wrap real URLs in a redirect link — unwrap it.
    const match = href.match(/uddg=([^&]+)/);
    if (match) href = decodeURIComponent(match[1]);
    if (title && href.startsWith('http')) results.push({ title, url: href });
  });

  return results;
}

function extractText(html) {
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, noscript, svg').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

async function fetchPageText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  const html = await res.text();
  return extractText(html).slice(0, MAX_CONTENT_CHARS);
}

app.post('/api/search', async (req, res) => {
  const { query } = req.body ?? {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing "query" in request body.' });
  }

  try {
    const results = await searchDuckDuckGo(query);
    const enriched = await Promise.all(
      results.map(async (r) => {
        try {
          const content = await fetchPageText(r.url);
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

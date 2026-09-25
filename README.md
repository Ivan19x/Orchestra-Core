# Orchestra-Core

Clear, practical financial education built for Kenya. 80 written lessons across
nine series, read in the browser. One-time payment via M-Pesa, no subscription.

- **Website:** https://orchestra-core.vercel.app
- **API:** https://orchestra-core.onrender.com
- **Operating manual:** [`docs/MANUAL.txt`](docs/MANUAL.txt) — full setup, going live, and running it day to day
- **Setup guide:** [`docs/SETUP.md`](docs/SETUP.md) — M-Pesa, database, hosting, deployment
- **Writing lessons:** [`CONTENT-README.md`](CONTENT-README.md)
- **Full project context:** [`CLAUDE.md`](CLAUDE.md)

## What's here

```
src/                 React website (Vite + TypeScript + Tailwind)
  content/lessons/   The 80 lessons, one Markdown file each — this is the product
  pages/             One file per route
  lib/               Lesson catalogue, session, API client, pricing
backend/             Express API — accounts, M-Pesa payments (deployed separately)
docs/SETUP.md        How to run and deploy the whole thing
recycle/             Not part of the website. Set aside, not deleted. Gitignored.
```

## Running it locally

Requires Node.js 20+.

**Website:**

```sh
npm install
npm run dev          # http://localhost:8080
```

**API** (only needed for signup / login / payment):

```sh
cd backend
npm install
cp .env.example .env # then fill it in — see docs/SETUP.md
npm run dev          # http://localhost:3001
```

Point the website at it by creating `.env.local` in the project root:

```
VITE_API_URL=http://localhost:3001
VITE_PRICE_KES=200
```

## Checks

```sh
npm run typecheck    # tsc, no emit
npm run lint         # eslint
npm run build        # production build into dist/
```

## Adding a lesson

Drop an `S<series>M<module>.md` file into `src/content/lessons/` and push. No
code changes. The format is in [`CONTENT-README.md`](CONTENT-README.md).

# Project: Orchestra-Core — AI Financial Literacy Coach

> This file is the single source of truth for this project. It covers every major decision, everything built so far, and exactly what remains before the first sale. Update it whenever something meaningful changes.

---

## Who's building this

Ivan — 21, BBIT student at Strathmore University (Nairobi, Kenya), Year 2. Building solo on a personal laptop (HP 245 G10). Career interests: Product Management / Business Analysis / Tech Sales in Kenya's fintech sector (Safaricom is an aspiration), eventual goal of founding his own business. Separately runs CYRION, a more technical personal project (local AI agent/OS with a multi-model Ollama "gears" architecture). Orchestra-Core shares some technical DNA with CYRION but is a distinct, public-facing product.

---

## What this project is

An AI-powered financial literacy and education app. A local LLM (via Ollama) plus a RAG knowledge base teaches people how money, markets, behavioral finance, and the people/institutions who move markets actually work — **education, not personalized financial advice**. Go-to-market: Kenya first, then global. Distribution: simplest first (downloadable local app) → hosted web → mobile, as resources allow.

---

## Brand identity

**Name: Orchestra-Core** — single unified name for the consumer-facing product, the multi-model AI engine/architecture, and the business. All other candidate names are retired (Compass, Cyrion, Dira, Fenwa, Doutdes, IIMITI — fully dropped, do not revisit).

**Tagline / motto (community-support area only):** *"Inter se pecuniarie adiuvantes"* — Latin for "helping one another financially." Use under the logo on the Support page only, not as the main brand name.

---

## Design system — maroon & white

| Token | Hex | Use |
|---|---|---|
| Primary maroon | `#7A2330` | CTAs, icons, price highlight, active states |
| White | `#FFFFFF` | Main page background |
| Blush/cream | `#FBF1EE` | Alternating "pause point" sections |
| Divider | `#F0E0DD` | Borders, separators |
| Dark text | `#2B2320` | Headings |
| Muted text | `#7A6C68` | Body / secondary text |
| Faint text | `#A39590` | Footer / fine print |

Typography: clean sans-serif throughout (Inter-style); headings medium weight (500), never heavy/bold. Optional serif for hero headline only. Overall vibe: warm, academic-premium rather than typical fintech blue.

---

## Website pages

Four-stage visitor journey: **Home → Explore → Try → Get Orchestra-Core**

| Route | Description |
|---|---|
| `/` | Hero, value props, sample lesson preview, pricing teaser, support teaser, closing CTA |
| `/how-it-works` | Sample chat, local-first privacy, lesson structure |
| `/lessons` | Searchable library across 3 series (Money basics / Smart money / Kenya money) |
| `/try` | No-signup static chat demo, 4-5 pre-loaded example questions |
| `/pricing` | Single card — KES 1,500 one-time, benefits, FAQ |
| `/checkout` | Full payment flow (see Payment system below) |
| `/login` | Returning user OTP sign-in |
| `/account` | License key display, download link, sign out |
| `/download` | Device scan + download CTA (gated: shows device scan only if paid) |
| `/support` | M-Pesa Till, Buy Me a Coffee, progress bar, supporter names |
| `/about` | Founder story, mission |
| `/ask` | Live AI chat panel (dev-only, not in nav) |
| `/dashboard` | Full product dashboard (dev-only, not in nav) |

Global nav: sticky white header, Logo (Orbit icon + "Orchestra**-Core**" wordmark), nav links center, "Get Orchestra-Core" → `/checkout` button right. Shows "Sign in" or "Account" link based on session state. Collapses to hamburger on mobile, CTA always visible.

---

## Product / app concept (what people use after buying)

Local LLM via Ollama + RAG knowledge base. Dashboard at `/dashboard`:
- Header: greeting + learning-streak badge (streaks tied to LEARNING progress only)
- "Today's insight" card — rotates through lesson corpus by day-of-year
- Quick tools row: Budget builder (50/30/20 calculator), "What would they do?" (Smart Money prompts), Market mood today — each pre-fills a question into `/ask`
- `AskPanel` — streaming chat with `qwen2.5:7b` via Ollama, source-lesson chips, Deep Dive web toggle
- `SupportPanel` — compact progress bar + M-Pesa CTA

### Content corpus — three series, 12 lessons (4 per series)
- **Money basics** — how money actually works, foundational concepts
- **Smart money** — 13F/13D filings, Buffett-style analysis, central bank communication, crypto on-chain concepts. All framed as educational case studies, never "copy them to get rich"
- **Kenya money** — M-Pesa, SACCOs, NSE, local financial landscape

All lesson content lives in `content/lessons/` as Markdown with frontmatter. Same content = curriculum + RAG corpus + content-marketing material (every lesson is a short-form video script).

---

## Technical architecture

### Stack overview

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite, Tailwind CSS, shadcn/ui |
| Routing | React Router v6 |
| AI chat | Ollama local server (qwen2.5:7b), browser-side RAG retrieval |
| In-app server | Express (`server/index.mjs`) — Deep Dive search + static file serving |
| Desktop packaging | Electron 33 + electron-builder (NSIS for Windows, DMG for Mac) |
| Payment backend | Express API (`backend/`) — separate from in-app server |
| Database | Supabase (managed PostgreSQL) |
| Auth | OTP via SMS/email → 30-day JWT in localStorage |
| Payments | Flutterwave (M-Pesa STK push + card, single integration) |
| SMS | Africa's Talking REST API |
| Email | Resend |

### Device-aware model tiers

| Tier | RAM | Model | Notes |
|---|---|---|---|
| Light | <4GB | Qwen2.5-0.5B (Apache-2.0) | Full lessons; basic chat |
| Standard | 4-8GB | Qwen2.5-3B (Apache-2.0) | Full content + solid chat |
| Pro | 8-16GB | Qwen2.5-7B (Apache-2.0) | Full app, fast chat — Phase 1 default |
| Max | 16GB+ | Qwen2.5-14B (Apache-2.0) | Best quality |

Key principle: static content (lessons) always ships regardless of device tier. Only chat quality scales with device.

### Key files / directories

```
investwise-manager-main/
├── src/
│   ├── pages/
│   │   ├── Home, HowItWorks, Lessons, Try, Pricing, Download, Support, About
│   │   ├── Ask.tsx          — live AI chat (dev-only)
│   │   ├── Dashboard.tsx    — product dashboard (dev-only)
│   │   ├── Checkout.tsx     — payment flow (new)
│   │   ├── Login.tsx        — returning user sign-in (new)
│   │   └── Account.tsx      — license key + download link (new)
│   ├── components/orchestra-core/
│   │   ├── Nav.tsx          — sticky header, auth-aware
│   │   ├── Footer.tsx
│   │   ├── Logo.tsx         — Orbit icon + wordmark, mobile monogram
│   │   ├── AskPanel.tsx     — reusable chat UI (used in /ask + /dashboard)
│   │   ├── DeviceScanPanel.tsx — device scan + download CTA
│   │   ├── OTPInput.tsx     — 6-digit code entry (new)
│   │   ├── ThinkingIndicator.tsx
│   │   ├── StreakBadge.tsx
│   │   └── SupportPanel.tsx
│   └── lib/
│       ├── orchestraCore.ts — Ollama chat + RAG retrieval + Deep Dive
│       ├── deviceScan.ts    — browser device signals
│       ├── modelTiers.ts    — four tier definitions
│       ├── lessons.ts       — lesson metadata
│       ├── quickTools.ts    — Smart Money / market mood prompts
│       ├── api.ts           — typed fetch wrapper for backend API (new)
│       └── session.ts       — JWT storage, useSession hook (new)
├── backend/                 — payment + auth API server (new)
│   ├── index.mjs            — Express entry point
│   ├── routes/
│   │   ├── auth.mjs         — send-otp, verify-otp, /me
│   │   └── payment.mjs      — initiate, webhook, status, verify
│   ├── lib/
│   │   ├── db.mjs           — all Supabase queries
│   │   ├── otp.mjs          — generate + bcrypt-verify 6-digit codes
│   │   ├── license.mjs      — generate OC-XXXXXXXX-XXXX-XXXX-XXXX keys
│   │   └── notify.mjs       — Africa's Talking SMS + Resend email
│   ├── supabase-schema.sql  — paste into Supabase SQL Editor to create tables
│   ├── .env.example         — every credential needed, with instructions
│   ├── Procfile             — Railway deployment (web: node index.mjs)
│   └── Dockerfile           — Docker deployment (any VPS)
├── server/                  — in-app local server (bundled inside Electron)
│   └── index.mjs            — Deep Dive search + static serving of dist/
├── electron/
│   └── main.cjs             — Electron main process, starts server sidecar
├── content/
│   ├── lessons/             — 12 lesson .md files (curriculum + RAG + marketing)
│   ├── rag-index.json       — 89 embedded chunks (gitignored, regenerate with npm run rag:build)
│   └── system-prompt.md     — AI coach persona, guardrails, Kenya examples
├── scripts/
│   ├── build-rag-index.mjs  — chunks lessons + embeds via nomic-embed-text
│   ├── query-rag.mjs        — test retrieval from CLI
│   └── ask.mjs              — test full ask pipeline from CLI
├── .github/workflows/
│   ├── release.yml          — auto-build Windows + Mac installers on git tag push
│   └── deploy-backend.yml   — auto-deploy backend to Railway on push to main
├── .env.local.example       — frontend env vars template (VITE_API_URL, VITE_DOWNLOAD_URL_WIN/MAC)
└── package.json             — version: 1.0.0, electron-builder config
```

---

## Payment & auth system (fully built, needs credentials + deployment)

### How it works end-to-end

**New buyer:**
1. Visits `/pricing` → clicks "Get Orchestra-Core" → goes to `/checkout`
2. **Step 1 — Identity:** enters email OR Kenyan phone number (+254...)
3. **Step 2 — Payment:** chooses M-Pesa or card
   - M-Pesa: enters M-Pesa number → backend calls Flutterwave → STK push sent to phone → frontend polls `/api/payment/status/:txRef` every 3 seconds until confirmed
   - Card: backend generates Flutterwave hosted checkout link → user redirected → pays → redirected back to `/checkout?step=card-return&tx_ref=...&transaction_id=...` → frontend calls `/api/payment/verify`
4. **Step 3 — OTP:** payment confirmed → OTP sent via SMS (Africa's Talking) or email (Resend) → user enters 6-digit code
5. **Step 4 — Done:** OTP verified → JWT issued (30-day) → license key displayed → download link shown

**Returning buyer:**
1. Visits `/login` → enters email or phone → OTP sent → enters code → redirected to `/account`
2. `/account` shows license key + download link

**Session storage:** JWT in `localStorage` under key `oc_token`. `useSession()` hook reads it and updates any component that cares (Nav, Download, Account). Sessions last 30 days — OTP again after that.

### Backend API routes

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Liveness check |
| POST | `/api/auth/send-otp` | Generate OTP, send via SMS or email (rate-limited: 3/10min per IP) |
| POST | `/api/auth/verify-otp` | Verify OTP → return JWT + user data (rate-limited: 8/10min) |
| GET | `/api/auth/me` | Validate JWT → return current user |
| POST | `/api/payment/initiate` | Start M-Pesa STK push OR generate Flutterwave card link |
| GET | `/api/payment/status/:txRef` | Poll payment status (pending/completed/failed) |
| POST | `/api/payment/verify` | Verify card payment after Flutterwave redirect |
| POST | `/api/payment/webhook` | Flutterwave fires this on payment completion (validates `verif-hash` header) |

### Database tables (Supabase)

**users** — `id`, `email`, `phone`, `license_key`, `has_paid`, `created_at`
**otp_codes** — `id`, `identifier`, `code_hash` (bcrypt), `expires_at` (10 min), `used`, `created_at`
**payments** — `id`, `user_id`, `tx_ref`, `amount`, `currency`, `payment_method`, `status`, `flw_tx_id`, `created_at`

### License key format
`OC-XXXXXXXX-XXXX-XXXX-XXXX-XXXX` (random 12-byte hex, uppercase). Generated on payment confirmation, stored in `users.license_key`, sent in confirmation SMS/email.

---

## Business model

**Price:** KES 1,500 one-time (~$11). No subscriptions.

**Revenue layers:**
1. Direct sales (primary)
2. Content marketing — lesson content repurposed as TikTok/IG/X short-form
3. B2B later — SACCOs, employers, universities (Phase 5)

**Support/donation feature:** "Support Orchestra-Core" — transparent progress bar, M-Pesa Till (Kenya), Buy Me a Coffee (international). Not equity crowdfunding.

---

## Legal / regulatory context (Kenya)

- **CMA:** Stay strictly on the education side — general/impersonal content only, never personalized buy/sell advice for specific securities.
- **Business registration:** BRS business name "Orchestra-Core" via eCitizen, ~KES 950 one-time. Separate annual County Single Business Permit (~KES 5,000-10,000) once actively trading.
- **Data Protection Act 2019:** Collecting email/phone for purchases. DPA *obligations* (lawful basis, privacy policy, data-subject rights, breach notification) apply from the first piece of personal data collected — no threshold. **Action required before first sale: publish Privacy Policy at `/privacy` (done).** Formal ODPC *registration* is a separate question: under the 2021 Registration Regulations you are exempt while under KES 5M annual turnover AND under 10 employees. Register with ODPC (KES 4,000) when approaching KES 5M or hiring staff. Note: the older Compass legal PDF said "no minimum-size exemption" — that referred to DPA obligations generally, not ODPC registration; the newer Orchestra-Core roadmap PDF correctly distinguishes the two.
- **Model licensing:** All models are Apache-2.0 (Qwen2.5 family) — safe to redistribute in a downloadable product.
- **RAG content:** Original summaries only, never verbatim book text.

---

## Roadmap

1. **Phase 1 — Ship something real.** ← WE ARE HERE
2. **Phase 2 — Meet people where their devices are.** (per-tier builds, budget Android)
3. **Phase 3 — Build the actual orchestra.** (multi-gear orchestrator, specialized models)
4. **Phase 4 — Let the community fund reach.** (business reg, ODPC, hosted tier on VPS)
5. **Phase 5 — Go where the trust already exists.** (SACCO/employer site licences)
6. **Phase 6 — Beyond Kenya.** (USD pricing, global app stores, second country module)

---

## Phase 1 — Complete status

### ✅ Done

- **12 lessons written** across Money basics / Smart money / Kenya money (`content/lessons/`, Markdown with frontmatter)
- **RAG pipeline** — `scripts/build-rag-index.mjs` embeds lessons via `nomic-embed-text` into `content/rag-index.json` (89 chunks). Run with `npm run rag:build`, test with `npm run rag:query -- "question"`
- **System prompt** written to `content/system-prompt.md` — educational framing, Socratic voice, Kenya examples, "not financial advice" guardrails
- **CLI ask pipeline** — `npm run ask -- "question"` does full RAG retrieval + streaming chat via Ollama end-to-end
- **`/ask` page** — live browser chat panel, source-lesson chips, Deep Dive web research toggle (scrapes DuckDuckGo via `server/index.mjs`)
- **`/dashboard` page** — full product dashboard: streak badge, Today's insight, Budget builder, Smart Money tools, Ask panel, Support panel
- **Electron desktop app** packaged and working:
  - `electron/main.cjs` forks `server/index.mjs` as sidecar, waits for `/api/health`, opens BrowserWindow
  - `server/package.json` + `server/node_modules` (~13MB pruned runtime deps) bundled into `app.asar` — excludes ~550MB dev toolchain
  - `build.win.signAndEditExecutable: false` in `package.json` fixes Windows symlink errors during NSIS build
  - `npm run electron:build:win` → `release/Orchestra-Core Setup 1.0.0.exe` (~80MB, verified working)
- **Device scan on Download page** — `src/lib/deviceScan.ts` + `src/lib/modelTiers.ts` + `DeviceScanPanel.tsx` — detects RAM, CPU, GPU/NPU, OS, storage; recommends one of 4 tiers; full transparency disclosure of what was checked
- **Logo / wordmark** — `src/components/orchestra-core/Logo.tsx`, Orbit icon, "Orchestra**-Core**" split colour, mobile "OC" monogram
- **Payment + auth system** (full implementation — needs credentials + deployment):
  - `backend/` directory — Express API, Supabase DB, OTP (bcrypt), Flutterwave payments, Africa's Talking SMS, Resend email
  - `src/pages/Checkout.tsx` — 4-step flow: identity → M-Pesa/card → processing → OTP → done
  - `src/pages/Login.tsx` — returning user OTP sign-in
  - `src/pages/Account.tsx` — license key, download link, sign out
  - `src/lib/api.ts` — typed fetch wrapper for all backend calls
  - `src/lib/session.ts` — JWT localStorage management, `useSession()` hook
  - `src/components/orchestra-core/OTPInput.tsx` — 6-digit code input with paste support
  - Nav updated: "Get Orchestra-Core" → `/checkout`, shows "Sign in" / "Account" based on JWT
  - Pricing CTA → `/checkout`
  - Download page gated: shows DeviceScanPanel only if `session.paid === true`
  - `DeviceScanPanel` download button is now a real `<a download>` when `VITE_DOWNLOAD_URL_WIN` / `VITE_DOWNLOAD_URL_MAC` is set; shows "coming soon" otherwise
- **Deployment config:**
  - `backend/Procfile` — for Railway (`web: node index.mjs`)
  - `backend/Dockerfile` — for any Docker-based VPS
  - `.github/workflows/release.yml` — auto-builds Windows + Mac installers on `git tag v*.*.*` push, uploads to GitHub Release
  - `.github/workflows/deploy-backend.yml` — auto-deploys backend to Railway on push to `main`
- **Supabase schema created** — tables `users`, `otp_codes`, `payments` running in Supabase project

---

### ⏳ Remaining — in order of priority

#### 1. Create service accounts and fill in `backend/.env`

Copy `backend/.env.example` → `backend/.env` and fill in:

| Credential | Where to get it |
|---|---|
| `JWT_SECRET` | Run in terminal: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → service_role key (Reveal) |
| `RESEND_API_KEY` | resend.com → sign up free → API Keys → Create → copy `re_...` key |
| `EMAIL_FROM` | `Orchestra-Core <onboarding@resend.dev>` (use their free domain to start) |
| `AT_API_KEY` | africastalking.com → register → Settings → API Key → Generate |
| `AT_USERNAME` | `sandbox` for testing; your registered username for production |
| `FLW_PUBLIC_KEY` | flutterwave.com → register → Settings → API Keys → Test mode |
| `FLW_SECRET_KEY` | same place, Test Secret Key |
| `FLW_WEBHOOK_SECRET` | Make up any random string (e.g. `oc_hook_abc123`) — you'll put the same string in Flutterwave's webhook settings |
| `FRONTEND_URL` | `http://localhost:5173` for dev; your real domain once deployed |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:5175,http://localhost:8080` for dev |

#### 2. Test the backend locally

```bash
cd backend
npm run dev
# Should print: Orchestra-Core API listening on :3001
```

Open browser → `http://localhost:3001/api/health` → should return `{"ok":true}`

Then test the full checkout flow at `http://localhost:5173/checkout` while both `npm run dev` (Vite) and `cd backend && npm run dev` are running.

#### 3. Deploy the backend to Railway

1. Push the whole project to a GitHub repo (`git init` → `git add .` → `git commit -m "initial"` → push to GitHub)
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. When asked for root directory, set it to `backend`
4. Add all `backend/.env` values in Railway's **Variables** tab
5. Railway auto-detects `Procfile` and runs `node index.mjs`
6. Railway gives you a URL like `https://orchestra-core-api.railway.app` — copy it

#### 4. Add Flutterwave webhook

1. In Flutterwave dashboard → Settings → Webhooks
2. Set URL to: `https://orchestra-core-api.railway.app/api/payment/webhook`
3. Set Secret Hash to the same string you put in `FLW_WEBHOOK_SECRET`

#### 5. Rebuild frontend with live backend URL

Create `.env.local` (copy from `.env.local.example`):
```
VITE_API_URL=https://orchestra-core-api.railway.app
```

Then rebuild:
```bash
npm run build
```

#### 6. Publish installer to GitHub Releases

Push a version tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions (`.github/workflows/release.yml`) automatically:
- Builds `Orchestra-Core Setup 1.0.0.exe` (Windows, ~80MB)
- Builds `Orchestra-Core-1.0.0.dmg` (Mac)
- Attaches both to a GitHub Release

Copy the `.exe` download URL from the release page.

#### 7. Set download URL and rebuild Electron app

Add to `.env.local`:
```
VITE_DOWNLOAD_URL_WIN=https://github.com/YOUR_USER/orchestra-core/releases/download/v1.0.0/Orchestra-Core-Setup-1.0.0.exe
```

Then rebuild the installer:
```bash
npm run electron:build:win
```

This bakes the real download URL into the DeviceScanPanel button. The Download page now shows a real clickable download link for paid users.

#### 8. Test end-to-end with Flutterwave sandbox

- Go through `/checkout` with a test phone/email
- For M-Pesa sandbox: use phone `+254708374149` (Flutterwave test number) — they simulate the STK push
- Verify OTP arrives (SMS sandbox shows in Africa's Talking dashboard; email goes to your inbox)
- Verify license key is generated and displayed
- Verify `/account` shows the license key
- Verify `/download` shows the download button

#### 9. Legal prerequisites before accepting real money

- [ ] **BRS business name registration** — "Orchestra-Core" at eCitizen.go.ke → Business Registration → Business Name → ~KES 950 one-time
- [x] **Privacy Policy and Terms of Service** — created at `/privacy` and `/terms`, linked from footer. DPA compliance requires these published before any purchase.
- [ ] **ODPC registration** — Formal registration with ODPC is NOT required before your first sale if turnover is under KES 5M and you have under 10 employees (2021 Registration Regulations exemption). However, register at odpc.go.ke (KES 4,000) as you approach KES 5M or hire staff. The Privacy Policy covers your day-1 DPA obligations.
- [ ] **IntaSend production verification** — confirm live keys are active and receiving payouts (IntaSend KYC required)
- [ ] **Africa's Talking production** — apply for a production shortcode/sender ID (requires KYC). Sandbox works for testing, production needed for real customers to receive SMS

#### 10. Content marketing (start before going live)

- Start posting 1-2 short-form clips per week drawn directly from the lesson corpus
- Every lesson = one video script. Platforms: TikTok Kenya, Instagram, X
- Goal: have an audience before launch, not after
- Example clips: "How one tweet wiped $2 trillion off markets", "What a 13F filing actually tells you", "Why M-Pesa is studied in Harvard Business School"

#### 11. Post-launch nice-to-haves (not blockers)

- [ ] Custom app icon (`.ico` for Windows, `.icns` for Mac) — replace default Electron icon
- [ ] Friendlier first-run Ollama setup screen in the Electron app (currently shows "Couldn't reach Orchestra-Core" if Ollama isn't running — works but could be clearer)
- [ ] Add `/ask` and `/dashboard` to nav (or a post-login redirect to dashboard) so users can reach them without DevTools
- [ ] Mac build tested and verified (`.dmg`) — only Windows verified so far
- [ ] Switch Africa's Talking from sandbox to production once KYC approved

---

## Deferred to later phases

**Phase 2:** per-tier download artifacts (currently one build for all tiers), smaller models actually shipping for Light/Standard tiers, budget Android support

**Phase 3:** multi-gear orchestrator (specialized models per domain, synthesized answers)

**Phase 4:** Formal ODPC registration (when approaching KES 5M turnover or hiring staff), hosted web tier on VPS funded by donations, Oracle Always-Free or Hetzner

**Phase 5:** SACCO/employer B2B licensing

**Phase 6:** USD pricing via Lemon Squeezy/Paddle, Google Play (Financial features declaration), second country module

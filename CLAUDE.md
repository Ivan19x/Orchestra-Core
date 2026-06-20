
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

## Live deployments

| Service | URL | Platform |
|---|---|---|
| Website | https://orchestra-core.vercel.app | Vercel (auto-deploys on push to main) |
| Backend API | https://orchestra-core.onrender.com | Render (auto-deploys on push to main) |
| GitHub repo | https://github.com/Ivan19x/Orchestra-Core | main branch |
| Releases | https://github.com/Ivan19x/Orchestra-Core/releases | Built by CI on every `v*.*.*` tag |

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
| `/download` | Single download button + what's-included info (gated: shown only if paid). No device scanning — every install gets the same fixed model lineup. |
| `/support` | M-Pesa Till, Buy Me a Coffee, progress bar, supporter names |
| `/about` | Founder story, mission |
| `/privacy` | Privacy Policy (DPA compliance) |
| `/terms` | Terms of Service |
| `/ask` | Live AI chat panel (dev-only, not in nav) |
| `/dashboard` | Full product dashboard (dev-only, not in nav) |
| `/app` | Electron/Android app shell — not a website page, only loaded inside the apps |

Global nav: sticky white header, Logo (Orbit icon + "Orchestra**-Core**" wordmark), nav links center, "Get Orchestra-Core" → `/checkout` button right. Shows "Sign in" or "Account" link based on session state. Collapses to hamburger on mobile, CTA always visible.

---

## Product / app concept (what people use after buying)

The downloadable Electron app (and Android APK) loads `/app` — a full shell separate from the website nav/footer.

**App shell layout (`src/pages/AppShell.tsx`):**
- Left sidebar (w-56, blush background): Logo, nav buttons (AI / Lessons / Support / Account), `SetupStatus` checklist at the bottom
- Main content area: switches between AI chat, lesson browser, support, account panels
- Update banner at top when a new version is available
- **Opens to the Lessons tab by default**, not AI Coach — a brand-new user lands on the curriculum with a prominent "New here? Start with the basics" card linking straight into Module 1's reader, not an empty chat box with no guidance.

**`SetupStatus` sidebar checklist (`src/components/orchestra-core/SetupStatus.tsx`):**
- Device scanned ✓ (cosmetic step, no longer ties to any tier decision)
- Ollama running ✓ / spinner
- Downloading models (1 of 3) / (2 of 3) / (3 of 3) — qwen2.5:7b, moondream, nomic-embed-text in sequence, each with its own % progress bar
- Collapses to "AI ready" when complete; reports completion up to `AppShell` via `onSetupComplete` so the AI tab can block input until setup actually finishes
- Invisible on website and Android (returns null when not in Electron)

**Setup runs in background** — the app shows full content immediately. There is no blocking setup screen. If someone opens AI Coach and tries to chat before setup finishes, the input is disabled with "Currently setting up the model, kindly wait…" instead of a failed request.

**Auto sign-in from website:** The deep link `orchestracore://auth?token=JWT` opens the app (if installed) and signs the user in automatically — no OTP needed in the app at all. Two entry points fire it: the checkout "done" screen (right after a fresh purchase) and a "Connect to desktop app" button on `/account` (for anyone already signed in on the website who wants to link an existing or newly-installed app, e.g. after reinstalling). The app's own Account tab leads with "Open my account on the website" pointing at this, with email+OTP kept only as a fallback. Single-instance lock ensures the token is delivered even if the app was already open.

**AI chat (`AppAI`):** Shows `AskPanel` in Electron. Shows "AI runs on desktop" message with download link on Android. The AI's role is explicitly *not* to be the primary teaching content — the lessons are the course. The AI explains lesson topics further, does live research via `web_search`/`web_fetch` tools when a question needs current information, and helps with practical account setup (M-Pesa, SACCOs, bank/brokerage accounts, CDS registration) as guidance, not personalized advice. Responds in Kiswahili when addressed in Kiswahili.

**Lesson browser (`AppLessons`):** Full series browser. Clicking a lesson card opens a full in-app reader (`LessonReader`) with the lesson's actual markdown content rendered — not just a summary. "Ask about this" remains as a secondary action to jump into AI Coach with the lesson pre-filled.

**Account (`AppAccount`):** Shows session info + OTP sign-in if not logged in.

### Content corpus — three series, 12+ lessons

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
| AI chat | Ollama local server (qwen2.5:7b), browser-side RAG retrieval, real tool-calling (web_search/web_fetch) |
| In-app server | Express (`server/index.mjs`) — web_search/web_fetch backend + static file serving |
| Desktop packaging | Electron 33 + electron-builder (NSIS for Windows, DMG for Mac, AppImage for Linux) |
| Auto-update | `electron-updater` — checks GitHub Releases on startup, downloads + installs silently |
| Mobile | Capacitor 8 wrapping the same React build as an Android APK |
| Payment backend | Express API (`backend/`) — deployed on Render |
| Database | Supabase (managed PostgreSQL) |
| Auth | OTP via SMS/email → 30-day JWT in localStorage |
| Payments | IntaSend (M-Pesa STK push + card) |
| SMS | Africa's Talking REST API (sandbox for now, production requires KYC) |
| Email | Resend |

### Fixed model lineup (no more device-RAM tiering)

Every install pulls the same three models — no device scan, no tier picking:

| Model | Purpose |
|---|---|
| `qwen2.5:7b` (Apache-2.0) | The one chat model, for everyone |
| `moondream` | Vision model — downloaded for a future feature, not yet wired into any UI |
| `nomic-embed-text` | RAG lesson retrieval embeddings |

Key principle: static content (lessons) always ships regardless of device. Previously the app picked one of 4 models (0.5B/3B/7B/14B) based on detected RAM — this was dropped because it added complexity without enough payoff; `qwen2.5:7b` is the standard for every install now. `electron/main.cjs`'s `REQUIRED_MODELS` array is the source of truth for the pull list; `runSetup()` pulls each in sequence with per-model progress reported to `SetupStatus.tsx`.

### Key files / directories

```
Orchestra-Core/
├── src/
│   ├── pages/
│   │   ├── Home, HowItWorks, Lessons, Try, Pricing, Download, Support, About
│   │   ├── Privacy.tsx, Terms.tsx
│   │   ├── Ask.tsx          — live AI chat (dev-only)
│   │   ├── Dashboard.tsx    — product dashboard (dev-only)
│   │   ├── Checkout.tsx     — 4-step payment flow
│   │   ├── Login.tsx        — returning user OTP sign-in
│   │   ├── Account.tsx      — license key + download link
│   │   └── AppShell.tsx     — Electron/Android app shell (loads at /app)
│   ├── components/orchestra-core/
│   │   ├── Nav.tsx          — sticky header, auth-aware
│   │   ├── Footer.tsx
│   │   ├── Logo.tsx         — Orbit icon + wordmark, mobile monogram
│   │   ├── AskPanel.tsx     — reusable chat UI (used in /ask, /dashboard, AppShell)
│   │   ├── SetupStatus.tsx  — sidebar setup checklist (Electron-only), multi-model progress
│   │   ├── DownloadPanel.tsx — single download button + what's-included info (no device scan)
│   │   ├── OTPInput.tsx     — 6-digit code entry with paste support
│   │   ├── ThinkingIndicator.tsx
│   │   ├── StreakBadge.tsx
│   │   └── SupportPanel.tsx
│   ├── lib/
│   │   ├── orchestraCore.ts — Ollama chat + RAG retrieval + web_search/web_fetch tool-calling
│   │   ├── lessonContent.ts — loads + parses content/lessons/**/*.md for the in-app reader
│   │   ├── lessons.ts       — lesson metadata
│   │   ├── quickTools.ts    — Smart Money / market mood prompts
│   │   ├── api.ts           — typed fetch wrapper for backend API
│   │   ├── session.ts       — JWT localStorage management, useSession hook
│   │   └── platform.ts      — isElectron, isCapacitor, isMobileApp, getPlatform()
│   └── hooks/
│       └── use-toast.ts     — toast notifications (Toaster/Sonner)
├── backend/                 — payment + auth API (deployed on Render)
│   ├── index.mjs            — Express entry point
│   ├── routes/
│   │   ├── auth.mjs         — send-otp, verify-otp, /me
│   │   └── payment.mjs      — IntaSend M-Pesa STK push + card, webhook, status
│   ├── lib/
│   │   ├── db.mjs           — all Supabase queries
│   │   ├── otp.mjs          — generate + bcrypt-verify 6-digit codes
│   │   ├── license.mjs      — generate OC-XXXXXXXX-XXXX-XXXX-XXXX keys
│   │   └── notify.mjs       — Africa's Talking SMS + Resend email
│   ├── supabase-schema.sql  — paste into Supabase SQL Editor to create tables
│   ├── .env.example         — every credential needed, with instructions
│   └── Dockerfile           — Docker deployment (any VPS)
├── server/                  — in-app local server (bundled inside Electron)
│   └── index.mjs            — web_search/web_fetch tool backend + static serving of dist/
├── electron/
│   ├── main.cjs             — Electron main process, starts server sidecar, auto-updater, deep link handler
│   └── preload.cjs          — contextBridge: exposes electronSetup + update IPC to renderer
├── content/
│   ├── lessons/             — Markdown lesson files (curriculum + RAG corpus + marketing scripts)
│   └── system-prompt.md     — AI coach persona, guardrails, Kenya examples
├── android/                 — Capacitor Android project (committed, build outputs gitignored)
├── recycle/                 — gitignored. Dead code + reference material set aside by a full repo
│                               audit (untrimmed shadcn scaffold, superseded lesson drafts, business
│                               docs), mirroring original paths for easy restoration if ever needed.
├── assets/                  — Source images for Capacitor icon/splash generation
│   ├── icon-only.png
│   └── splash.png
├── build/
│   └── icon.png             — App icon source for electron-builder
├── public/
│   ├── logo-512.png
│   ├── favicon.ico
│   └── rag-index.json       — 134 embedded chunks, committed to repo (regenerate with `npm run rag:build`, requires local Ollama + nomic-embed-text). This is the path the app actually fetches at runtime — do not move it.
├── scripts/
│   ├── build-rag-index.mjs  — chunks lessons + embeds via nomic-embed-text
│   ├── query-rag.mjs        — test retrieval from CLI
│   └── ask.mjs              — test full ask pipeline from CLI
├── capacitor.config.ts      — Capacitor config (appId: com.orchestracore.app)
├── .github/workflows/
│   ├── release.yml          — builds Windows + Mac + Linux + Android on git tag push
│   └── deploy-backend.yml   — auto-deploys backend to Render on push to main
├── .env.local.example       — frontend env vars template
└── package.json             — version: 1.2.0
```

### IPC bridge (Electron preload → renderer)

`window.electronSetup` is exposed via contextBridge:
- `onProgress(cb)` — setup step updates: `{ step, detail, percent? }`
- `onComplete(cb)` — setup finished: `{ model }`
- `onError(cb)` — setup failed: `{ step, message }`
- `notifyReady()` — renderer calls this when mounted; triggers main to start setup
- `onToken(cb)` — deep link JWT delivered: `{ token }`
- `onUpdateAvailable(cb)` / `onUpdateProgress(cb)` / `onUpdateDownloaded(cb)` — auto-update events
- `installUpdate()` — trigger quit-and-install

### Auto-update flow

1. App starts → after 10 seconds, `autoUpdater.checkForUpdatesAndNotify()` runs
2. If new version found → downloads silently → sends `update:downloaded` IPC
3. AppShell shows banner: "v1.x.x is ready — Restart & update"
4. User clicks → `installUpdate()` → `autoUpdater.quitAndInstall(false, true)`
5. App restarts with new version

Update source: GitHub Releases (`latest.yml` / `latest-mac.yml` / `latest-linux.yml` published by electron-builder).

### Deep link auto sign-in

Protocol: `orchestracore://auth?token=JWT_TOKEN`

- `app.setAsDefaultProtocolClient('orchestracore')` registered in main.cjs
- `app.requestSingleInstanceLock()` ensures second instance passes URL to first via `second-instance` event
- `handleDeepLink(url)` parses token and sends `setup:token` IPC to renderer
- If app not yet open when link is clicked, token is stored in `pendingToken` and delivered once window is ready
- Checkout done screen shows: `<a href="orchestracore://auth?token=...">Open in Orchestra-Core app</a>`

---

## Payment & auth system

### How it works end-to-end

**New buyer:**
1. Visits `/pricing` → clicks "Get Orchestra-Core" → goes to `/checkout`
2. **Step 1 — Identity:** enters email OR Kenyan phone number (+254...)
3. **Step 2 — Payment:** chooses M-Pesa or card
   - M-Pesa: enters M-Pesa number → backend calls IntaSend → STK push sent to phone → frontend polls `/api/payment/status/:txRef` every 3 seconds until confirmed
   - Card: backend generates IntaSend hosted checkout link → user redirected → pays → redirected back → frontend calls `/api/payment/verify`
4. **Step 3 — OTP:** payment confirmed → OTP sent via SMS (Africa's Talking) or email (Resend) → user enters 6-digit code
5. **Step 4 — Done:** OTP verified → JWT issued (30-day) → license key displayed → download link shown → deep link button to open app

**Returning buyer:**
1. Visits `/login` → enters email or phone → OTP sent → enters code → redirected to `/account`
2. `/account` shows license key + download link

**Testing mode:** `TESTING_FREE=true` on Render allows checkout to complete without real payment. Set to `false` before accepting real money.

**Session storage:** JWT in `localStorage` under key `oc_token`. `useSession()` hook reads it and updates any component that cares (Nav, Download, Account). Sessions last 30 days.

### Backend API routes

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Liveness check |
| POST | `/api/auth/send-otp` | Generate OTP, send via SMS or email (rate-limited: 3/10min per IP) |
| POST | `/api/auth/verify-otp` | Verify OTP → return JWT + user data (rate-limited: 8/10min) |
| GET | `/api/auth/me` | Validate JWT → return current user |
| POST | `/api/payment/initiate` | Start IntaSend M-Pesa STK push OR generate card checkout link |
| GET | `/api/payment/status/:txRef` | Poll payment status (pending/completed/failed) |
| POST | `/api/payment/verify` | Verify card payment after redirect |
| POST | `/api/payment/webhook` | IntaSend fires this on payment completion |

### Backend environment variables (on Render)

| Variable | Value |
|---|---|
| `JWT_SECRET` | 64-byte random hex |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key |
| `RESEND_API_KEY` | Resend API key (`re_...`) |
| `EMAIL_FROM` | `Orchestra-Core <onboarding@resend.dev>` |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_USERNAME` | `sandbox` (testing) → production username when KYC approved |
| `INTASEND_PUBLISHABLE_KEY` | IntaSend publishable key |
| `INTASEND_SECRET_KEY` | IntaSend secret key |
| `INTASEND_WEBHOOK_SECRET` | Random string matching IntaSend webhook settings |
| `FRONTEND_URL` | `https://orchestra-core.vercel.app` |
| `CORS_ORIGINS` | `https://orchestra-core.vercel.app` (add localhost entries for local dev) |
| `TESTING_FREE` | `true` during testing phase; `false` for real sales |
| `NODE_ENV` | `production` |

### Database tables (Supabase)

**users** — `id`, `email`, `phone`, `license_key`, `has_paid`, `created_at`
**otp_codes** — `id`, `identifier`, `code_hash` (bcrypt), `expires_at` (10 min), `used`, `created_at`
**payments** — `id`, `user_id`, `tx_ref`, `amount`, `currency`, `payment_method`, `status`, `intasend_tx_id`, `created_at`

### License key format
`OC-XXXXXXXX-XXXX-XXXX-XXXX-XXXX` (random 12-byte hex, uppercase). Generated on payment confirmation, stored in `users.license_key`, sent in confirmation SMS/email.

---

## CI / release pipeline

`.github/workflows/release.yml` — triggered on any `v*.*.*` tag push.

Four parallel jobs, all on Node 22, all with `permissions: contents: write`:

| Job | Runner | Output |
|---|---|---|
| build-windows | windows-latest | `Orchestra-Core Setup X.X.X.exe` + `latest.yml` |
| build-mac | macos-latest | `Orchestra-Core-X.X.X.dmg` + `latest-mac.yml` |
| build-linux | ubuntu-latest | `Orchestra-Core-X.X.X.AppImage` + `latest-linux.yml` |
| build-android | ubuntu-latest | `app-release-unsigned.apk` |

All artifacts are uploaded to the GitHub Release. The `latest*.yml` files are what `electron-updater` uses to detect and serve updates.

**To release a new version:**
```bash
# 1. Bump version in package.json (use [System.IO.File]::WriteAllText — NOT Set-Content -Encoding utf8, which adds a BOM and breaks CI)
# 2. Commit
git add package.json
git commit -m "chore: bump to vX.X.X"
git push origin main
# 3. Tag
git tag vX.X.X
git push origin vX.X.X
# 4. Wait ~15 min for CI → go to GitHub Releases → Edit → Publish (remove Draft status)
```

**Critical: never use PowerShell `Set-Content -Encoding utf8` on package.json** — PowerShell 5.1 writes a UTF-8 BOM which breaks Vite's JSON parsing on CI. Always use:
```powershell
$utf8NoBOM = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("$pwd\package.json", $content, $utf8NoBOM)
```

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
- **Data Protection Act 2019:** Privacy Policy live at `/privacy`, Terms at `/terms`. DPA obligations apply from first data collected. ODPC formal registration not required until KES 5M turnover or 10+ staff.
- **Model licensing:** All models are Apache-2.0 (Qwen2.5 family) — safe to redistribute in a downloadable product.
- **RAG content:** Original summaries only, never verbatim book text.

---

## Roadmap

1. **Phase 1 — Ship something real.** ← WE ARE HERE
2. **Phase 2 — Meet people where their devices are.** (per-tier builds, budget Android)
3. **Phase 3 — Build the actual orchestra.** (multi-gear orchestrator, specialized models)
4. **Phase 4 — Let the community fund reach.** (ODPC, hosted tier on VPS)
5. **Phase 5 — Go where the trust already exists.** (SACCO/employer site licences)
6. **Phase 6 — Beyond Kenya.** (USD pricing, global app stores, second country module)

---

## Phase 1 — Complete status

### ✅ Done

- **Lesson content** — 12+ lessons across 3 series in `content/lessons/`, Markdown with frontmatter
- **RAG pipeline** — `public/rag-index.json` (134 chunks, 16 lessons) committed to repo; `npm run rag:build` regenerates it; `npm run rag:query` tests retrieval. (Was broken for every release through v1.1.6: the index lived only at the gitignored `public/rag-index.json` path and was never committed, so every shipped build had zero lesson grounding — fixed by committing it and deleting the stale, unused `content/rag-index.json` that nothing actually read.)
- **System prompt** — `content/system-prompt.md` — educational framing, Socratic voice, Kenya examples, "not financial advice" guardrails
- **CLI ask pipeline** — `npm run ask -- "question"` does full RAG + streaming Ollama end-to-end
- **`/ask` page** — live browser chat panel, source-lesson chips, Deep Dive toggle (now real tool-calling, not a pre-search)
- **`/dashboard` page** — streak badge, Today's insight, Budget builder, Smart Money tools, Ask panel, Support panel
- **Electron app** — `AppShell` opens to Lessons by default with a "Start here" card, in-app lesson reader, sidebar setup checklist (multi-model progress), auto-updater, deep link sign-in
- **Android app** — Capacitor 8 wrapping the React build; `android/` project committed; icons generated
- **Fixed model lineup** — every install pulls `qwen2.5:7b` + `moondream` + `nomic-embed-text`, no device scanning or tiering (`DownloadPanel.tsx` on the website, `REQUIRED_MODELS` in `electron/main.cjs`)
- **AI tool-calling** — `web_search`/`web_fetch` tools the model can call itself when a question needs current information, via `server/index.mjs`'s `/api/web-search` and `/api/web-fetch`
- **Logo / wordmark** — `Logo.tsx`, Orbit icon, "Orchestra**-Core**" split colour, "OC" monogram
- **Payment + auth system** — IntaSend M-Pesa + card, OTP via SMS/Resend, JWT sessions, license keys
- **Checkout flow** — `/checkout` (4 steps) + `/login` + `/account`
- **Website** — all pages live at https://orchestra-core.vercel.app, auto-deploys on push
- **Backend** — deployed on Render at https://orchestra-core.onrender.com, `TESTING_FREE=true`
- **CI pipeline** — 4-platform builds (Windows, Mac, Linux, Android) on every version tag
- **Privacy Policy + Terms** — live at `/privacy` and `/terms`

---

### ⏳ Remaining before first real sale

#### 1. Confirm Render environment variables are production values

`FRONTEND_URL` and `CORS_ORIGINS` on Render need the production Vercel URL, not localhost dev values — check the Render dashboard directly (can't be verified from the repo). Note: as of this session, the backend's CORS config (`backend/index.mjs`) always allows `http://localhost:5175` (the Electron app's fixed local origin) in code, regardless of what `CORS_ORIGINS` is set to — so the *app* won't break even if this is still wrong, but the *website* will if `CORS_ORIGINS` doesn't include the Vercel URL.

#### 2. Set `VITE_DOWNLOAD_URL_WIN` on Vercel

1. Copy the `.exe` URL from the latest published GitHub Release
2. Vercel → Orchestra-Core → Settings → Environment Variables → add `VITE_DOWNLOAD_URL_WIN`
3. Redeploy

This makes the Download page show a real link for paid users. Still not confirmed done as of this session.

#### 3. Configure IntaSend webhook

In IntaSend dashboard → Webhooks:
- URL: `https://orchestra-core.onrender.com/api/payment/webhook`
- Secret: same value as `INTASEND_WEBHOOK_SECRET` on Render

#### 4. BRS business name registration

"Orchestra-Core" at eCitizen.go.ke → Business Registration → Business Name → ~KES 950 one-time. Required before accepting real money.

#### 5. Turn off testing mode when ready to charge

Set `TESTING_FREE=false` on Render. Before doing this, complete end-to-end test with IntaSend sandbox:
- Go through `/checkout` with a test phone
- Verify OTP arrives (email works now; SMS needs Africa's Talking production for real phones)
- Verify license key generated, `/account` shows it, `/download` shows the button

#### 6. Africa's Talking production KYC

Currently `AT_USERNAME=sandbox` — real users won't receive SMS OTPs. Apply at africastalking.com for a production shortcode/sender ID (requires KYC, takes a few days). Until then, OTP via email works fine as a fallback.

---

### ⏳ Post-launch improvements (not blockers)

- [x] **Ollama first-run handling** — `main.cjs`'s `runSetup()` already auto-downloads and silently installs Ollama if missing, then pulls the model lineup — no manual screen needed. If something does fail, `SetupStatus` shows a "Try again" button + a link to ollama.com.
- [x] **App icon + branded installer** — `build/icon.ico` (multi-res) and `build/installerSidebar.bmp` (164x314, maroon background + white logo + wordmark) generated via `node scripts/build-installer-assets.mjs`. `nsis` config in `package.json` sets `oneClick: false` (required for the sidebar to render) with `installerIcon`/`uninstallerIcon`/`installerHeaderIcon`/`installerSidebar`/`uninstallerSidebar`. Verified locally: `npx electron-builder --win --publish=never` builds cleanly with no NSIS errors from the custom assets. Mac `.icns` still auto-generated by electron-builder from `build/icon.png` (512x512 source) — no separate action needed there.
- [ ] **Dashboard/Ask nav for web users** — `/dashboard` and `/ask` exist but aren't reachable from the website nav post-login. Add a "Go to dashboard" link on the `/account` page or in Nav when session.paid is true
- [ ] **Android APK signing** — current CI output is unsigned (works for sideloading, can't go on Google Play). Needs a signing keystore + Gradle signing config
- [ ] **iOS** — Capacitor config is ready but requires Apple Developer account ($99/year) and a Mac build. Deferred
- [ ] **Mac DMG** — CI now builds it but it hasn't been locally tested end-to-end
- [ ] **Content marketing** — start posting 1-2 clips/week from lesson corpus before launch. TikTok Kenya, Instagram, X. Example: "How one tweet wiped $2 trillion off markets", "What a 13F filing actually tells you", "Why M-Pesa is studied in Harvard Business School"
- [x] **"Reading a payslip" lesson promoted** — now `1-9-reading-a-payslip.md`, Module 9 of series-1 (PAYE/NSSF/SHIF/Housing Levy).
- [ ] **moondream has no UI yet** — pulled during setup alongside qwen2.5:7b and nomic-embed-text, but nothing in the app uses vision capability yet. Wire up a feature (e.g. "read this payslip/receipt screenshot") or it's just sitting unused on every install.

---

## Deferred to later phases

**Phase 2:** budget Android support, revisit smaller models if the fixed qwen2.5:7b lineup proves too heavy for lower-end laptops

**Phase 3:** multi-gear orchestrator (specialized models per domain, synthesized answers)

**Phase 4:** Formal ODPC registration (when approaching KES 5M turnover or hiring staff), hosted web tier on VPS funded by donations

**Phase 5:** SACCO/employer B2B licensing

**Phase 6:** USD pricing via Lemon Squeezy/Paddle, Google Play (Financial features declaration), second country module

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
| `/lessons` | Searchable library across 3 series (Money basics / Smart money / Kenya money). Cards are now clickable and open a full in-browser reader. **Free lessons are readable by anyone; premium lessons are gated** behind `session.paid` (per-lesson `premium` flag in `lessons.ts`). Cards show a "Free"/"Premium" badge accordingly. |
| `/lessons/:slug` | Single-lesson reader (`Lesson.tsx`) — renders the lesson's markdown in the browser via the shared `LessonArticle` component. A premium lesson shows a purchase gate (title + summary + "Get Orchestra-Core") instead of the body unless `session.paid`. `:slug` is the last path segment of the lesson's content key — see `lessonUrlSlug()`/`getLessonByUrlSlug()` in `lessons.ts`. |
| `/try` | No-signup static chat demo, 4-5 pre-loaded example questions |
| `/pricing` | Single card — KES 2,000 one-time, benefits, FAQ |
| `/checkout` | Full payment flow (see Payment system below) |
| `/login` | Returning user password sign-in |
| `/account` | License key display, dashboard link, desktop-app connect (deep link) + download (paused) cards, sign out |
| `/download` | **Desktop app downloads are paused** (see "Desktop app on pause" below) — page always shows a paused message regardless of session, with a CTA to `/dashboard` (paid) or `/checkout` (not paid). `DownloadPanel.tsx` is unused while paused, not deleted. |
| `/support` | M-Pesa Till, Buy Me a Coffee, progress bar, supporter names |
| `/about` | Founder story, mission |
| `/privacy` | Privacy Policy (DPA compliance) |
| `/terms` | Terms of Service |
| `/ask` | Live AI chat panel (dev-only, not in nav) |
| `/dashboard` | **The actual product now** — lessons, AI chat, and learning tools, all in-browser. Includes a "Your lessons" section listing the first lessons, each linking into the `/lessons/:slug` reader. Despite still being absent from the public nav `links` array, it's where every paid session is actually routed: `Nav.tsx`'s CTA button shows "Open dashboard" → `/dashboard` instead of "Get Orchestra-Core" whenever `session?.paid` is true, and it's the primary destination from Checkout's "done" screen and from `/download`'s paused message. |
| `/app` | Electron/Android app shell — not a website page, only loaded inside the apps |

Global nav: sticky white header, Logo (Orbit icon + "Orchestra**-Core**" wordmark), nav links center. Right side swaps based on session: signed out → "Get Orchestra-Core" → `/checkout`; signed in but unpaid → same button, "Sign in"/"Account" link added; signed in and paid → "Open dashboard" → `/dashboard`. Collapses to hamburger on mobile, CTA always visible.

---

## Desktop app on pause — focus is the website (as of 23 June 2026)

The downloadable Electron/Android app still exists in full (code untouched,
CI still builds it on every tag) but is **not currently being offered or
linked anywhere as the way to access a purchase**. Decision: the local-AI
experience inside the app "isn't working well" yet (founder's words) and is
being set aside for later — right now, focus is entirely on the website:
buying, lesson content, and pricing, which are far faster to iterate on than
an Electron release cycle. AI chat is acknowledged as still under
construction wherever it's offered (in-browser via `/dashboard`'s `AskPanel`,
same as the app — same `localhost:11434` Ollama dependency, see "AI chat"
below), but lesson reading on the website is fully real and is the priority
right now.

Concretely:
- `/download` always shows a paused message (not gated by `session.paid`
  the way it used to be) — see the website pages table above.
- Checkout's "done" screen and `/account`'s desktop-app card both point at
  `/dashboard` first; the app deep-link button (`orchestracore://auth?...`)
  was removed from Checkout's done screen specifically (still present on
  `/account` for anyone who already has the app installed from before the
  pause — that case is still real and still works).
- Nothing about pricing, licensing, or what a purchase includes changed —
  the desktop app is still part of what a buyer's licence covers (see
  Terms.tsx Section 2), it's just not the delivery mechanism right now.
  No separate purchase will be needed when it returns.
- This is reversible by re-adding the relevant links/CTAs — nothing about
  the app itself was removed or disabled, only its visibility on the
  website.

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

**Model downloads survive interruption** (`runSetup()` in `electron/main.cjs`): each of the 3 required models gets its own retry budget (3 attempts, with a backoff sleep between retries) — one model failing doesn't block the others from being attempted. `ollama pull` resumes from its local blob cache rather than restarting at 0%, so a retry (or the user simply reopening the app after closing it mid-download) picks up where it left off instead of re-downloading from scratch. If a model still fails after all retries, the error message tells the user it'll auto-resume next time they open the app — which is true, since `runSetup()` re-checks `hasModel()` for each model on every launch and only pulls what's still missing.

**Auto sign-in from website:** The deep link `orchestracore://auth?token=JWT` opens the app (if installed) and signs the user in automatically — no OTP needed in the app at all. Two entry points fire it: the checkout "done" screen (right after a fresh purchase) and a "Connect to desktop app" button on `/account` (for anyone already signed in on the website who wants to link an existing or newly-installed app, e.g. after reinstalling). The app's own Account tab leads with "Open my account on the website" pointing at this, with email+password kept only as a fallback. Single-instance lock ensures the token is delivered even if the app was already open.

**AI chat (`AppAI`):** Shows `AskPanel` in Electron. Shows "AI runs on desktop" message with download link on Android. The AI's role is explicitly *not* to be the primary teaching content — the lessons are the course. The AI explains lesson topics further, does live research via `web_search`/`web_fetch` tools when a question needs current information, and helps with practical account setup (M-Pesa, SACCOs, bank/brokerage accounts, CDS registration) as guidance, not personalized advice. Responds in Kiswahili when addressed in Kiswahili.

**Lesson browser (`AppLessons`):** Full series browser. Clicking a lesson card opens a full in-app reader (`LessonReader`) with the lesson's actual markdown content rendered — not just a summary. `LessonReader` now renders the body via the shared `LessonArticle` component (same one the website's `/lessons/:slug` reader uses), so the two stay visually identical. "Ask about this" remains as a secondary action to jump into AI Coach with the lesson pre-filled.

**Account (`AppAccount`):** Shows session info + password sign-in if not logged in.

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
| Auth | Password (bcrypt-hashed) → 30-day JWT in localStorage |
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
│   │   ├── Lesson.tsx       — single-lesson in-browser reader (/lessons/:slug), premium-gated
│   │   ├── Privacy.tsx, Terms.tsx
│   │   ├── Ask.tsx          — live AI chat (dev-only)
│   │   ├── Dashboard.tsx    — product dashboard (dev-only)
│   │   ├── Checkout.tsx     — 4-step payment flow
│   │   ├── Login.tsx        — returning user password sign-in
│   │   ├── Account.tsx      — license key + download link
│   │   └── AppShell.tsx     — Electron/Android app shell (loads at /app)
│   ├── components/orchestra-core/
│   │   ├── Nav.tsx          — sticky header, auth-aware
│   │   ├── Footer.tsx
│   │   ├── Logo.tsx         — Orbit icon + wordmark, mobile monogram
│   │   ├── AskPanel.tsx     — reusable chat UI (used in /ask, /dashboard, AppShell)
│   │   ├── LessonArticle.tsx — shared lesson header + markdown body (web /lessons/:slug reader + AppShell's in-app reader), renders tables via remark-gfm
│   │   ├── SetupStatus.tsx  — sidebar setup checklist (Electron-only), multi-model progress
│   │   ├── DownloadPanel.tsx — single download button + what's-included info (no device scan)
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
│   └── release.yml          — builds Windows + Mac + Linux + Android on git tag push
├── .env.local.example       — frontend env vars template
└── package.json             — version: 1.3.0
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
2. **Step 1 — Identity (password account, created *before* any charge):** enters email + password (min. 8 chars) → `POST /api/auth/signup` creates the account immediately (bcrypt-hashed password) and returns a JWT (30-day), saved to localStorage, `paid: false`. No OTP/email-code step anywhere in this flow — the account is fully real and accessible the moment it's created, which also sidesteps Resend's email-deliverability restriction entirely (no code ever needs to reach the customer's inbox to sign up or sign in). If the email already has a password-protected account, signup is rejected (409) and the user is pointed to `/login`. If signup returns `paid: true` (re-buying after already owning a licence), skip straight to `/account` — nothing to charge.
3. **Step 2 — Payment:** chooses M-Pesa or "Other" (card, Google Pay, Apple Pay, Pesalink, KE bank transfer, Cash App, PYUSD — whichever IntaSend rails are enabled in the IntaSend dashboard; all surfaced automatically by IntaSend's hosted checkout page, no separate integration needed per method)
   - M-Pesa: enters M-Pesa number → backend calls IntaSend → STK push sent to phone → frontend polls `/api/payment/status/:txRef` every 3 seconds until confirmed
   - Other: backend generates IntaSend hosted checkout link → user redirected → pays with whichever method they choose on IntaSend's page → redirected back to `/checkout?step=card-return&tx_ref=...`. The component remounts fresh here (component state is gone) — identity is recovered from the session saved in Step 1 (`getStoredUser()`), not from component state.
4. **Step 3 — Done:** payment confirmed → `GET /api/auth/me` fetches the freshly-generated license key → displayed, download link shown, deep link button to open app

`TESTING_PHASE` (`VITE_TESTING_PHASE` on Vercel) skips Step 2 entirely after signup — calls `/api/payment/initiate` with `method: 'free'` and goes straight to Done. Separate flag from the backend's `TESTING_FREE`.

**Returning buyer:**
1. Visits `/login` → enters email + password → `POST /api/auth/login` verifies the bcrypt hash → redirected to `/account`
2. `/account` shows license key + download link

**Testing mode:** `TESTING_FREE=true` on Render allows checkout to complete without real payment. Set to `false` before accepting real money — still `true` as of this session (see go-live checklist step 4 below); `PRICE_KES` env var can temporarily override the charged amount (e.g. `10`) for a cheap real end-to-end test before reverting to the real price.

**Session storage:** JWT in `localStorage` under key `oc_token`. `useSession()` hook reads it and updates any component that cares (Nav, Download, Account). Sessions last 30 days.

**OTP infrastructure (otp.mjs, send-otp/verify-otp routes) is still in the codebase but unused by any active flow** — kept in case a future feature (2FA, password reset) wants it, not wired into signup/login anymore. `OTPInput.tsx` was removed (moved to `recycle/`) since nothing renders it now.

### Backend API routes

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Liveness check |
| POST | `/api/auth/signup` | Create account with email + password (rate-limited: 10/10min) |
| POST | `/api/auth/login` | Verify email + password → JWT + user data (rate-limited: 10/10min) |
| GET | `/api/auth/me` | Validate JWT → return current user |
| POST | `/api/payment/initiate` | Start IntaSend M-Pesa STK push OR generate hosted checkout link |
| GET | `/api/payment/status/:txRef` | Poll payment status (pending/completed/failed) |
| POST | `/api/payment/verify` | Verify card/other payment after redirect |
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

**Price:** KES 2,000 one-time (~$15). No subscriptions.

**Revenue layers:**
1. Direct sales (primary)
2. Content marketing — lesson content repurposed as TikTok/IG/X short-form
3. B2B later — SACCOs, employers, universities (Phase 5)

**Support/donation feature:** "Support Orchestra-Core" — transparent progress bar, M-Pesa Till (Kenya), Buy Me a Coffee (international). Not equity crowdfunding.

**Infrastructure cost discipline:** every piece of infrastructure (Vercel, Render, Supabase, Resend, IntaSend, GitHub) runs on a genuinely free tier — zero recurring monthly or annual cost. This is a hard constraint while solo-bootstrapping, not a preference: check whether a free-tier path exists before adding or recommending any paid service or domain. It's also why password-based accounts replaced OTP rather than buying a domain to fix Resend's sender restriction — the domain would have worked but cost money, so the free engineering fix was chosen instead. The first place real infrastructure spend is planned is the eventual local-AI-to-hosted-AI migration, funded by revenue at that point — not before.

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
- **Payment + auth system** — IntaSend (M-Pesa, card, Google Pay, Apple Pay, Pesalink, KE bank, Cash App, PYUSD), password-based accounts (bcrypt), JWT sessions, license keys
- **Checkout flow** — `/checkout` (4 steps) + `/login` + `/account`
- **Website** — all pages live at https://orchestra-core.vercel.app, auto-deploys on push
- **Backend** — deployed on Render at https://orchestra-core.onrender.com, `TESTING_FREE=true`
- **CI pipeline** — 4-platform builds (Windows, Mac, Linux, Android) on every version tag
- **Privacy Policy + Terms** — live at `/privacy` and `/terms`

---

### ⏳ Go-live checklist (code is fully ready — only dashboard steps remain)

BRS business name is registered. IntaSend application is approved for live
payments. Switching to password-based accounts (see "Payment & auth system"
above) means a domain and Resend email-deliverability fix are no longer
required to go live — see "Deferred, not blocking" below for why. Every
remaining step below is a dashboard action only the account owner can take
(no API/CLI access available for any of these) — the code side is already
done and waiting. Do them in this order:

#### 1. Rotate IntaSend keys and configure the webhook

The live keys currently in use sat exposed in git history earlier (since
purged, repo is now public) — rotate them before real money flows through:
1. IntaSend dashboard → Settings → API Keys → generate new live publishable
   + secret keys.
2. IntaSend dashboard → Webhooks → URL: `https://orchestra-core.onrender.com/api/payment/webhook`,
   set a secret string.
3. Render → set `INTASEND_PUBLISHABLE_KEY`, `INTASEND_SECRET_KEY` (new
   values), `INTASEND_WEBHOOK_SECRET` (matching what you set in IntaSend).
   No code change needed — `payment.mjs` already auto-detects live vs
   sandbox from the key prefix and already authenticates webhooks against
   `INTASEND_WEBHOOK_SECRET`.

#### 2. Production environment variables on Render

| Variable | Required value |
|---|---|
| `FRONTEND_URL` | `https://orchestra-core.vercel.app` |
| `CORS_ORIGINS` | `https://orchestra-core.vercel.app` |
| `NODE_ENV` | `production` |
| `EMAIL_FROM` | current shared `onboarding@resend.dev` sender is fine to leave as-is — see "Deferred, not blocking" below |
| `INTASEND_*` | set in step 1 above |
| `PRICE_KES` | set to `2000` (the real price) or remove the variable entirely — `payment.mjs`'s code default is now `2000`, so unset behaves the same as `2000` |
| `TESTING_FREE` | **set to `false`** — this is the official-launch switch, not a testing one. Leave `true` only for a deliberate short test window. |

Note: the backend's CORS config (`backend/index.mjs`) always allows
`http://localhost:5175` (the Electron app's fixed local origin) in code
regardless of `CORS_ORIGINS` — so the *app* won't break even if this is
still wrong, but the *website* will if `CORS_ORIGINS` doesn't include the
Vercel URL.

#### 3. Vercel environment variables

- Confirm `VITE_API_URL=https://orchestra-core.onrender.com`
- **Set `VITE_TESTING_PHASE` to `false` or remove it entirely** — this is
  the frontend half of going live (separate flag from the backend's
  `TESTING_FREE`, both must be off). Leaving it `true` shows "0 KES, free
  during testing" on `/` and `/pricing` regardless of what the backend
  charges.
- `VITE_DOWNLOAD_URL_WIN` no longer needs to be set — desktop downloads
  are paused (see "Desktop app on pause" above), so `/download` doesn't
  use this variable right now. Revisit when downloads resume.

#### 4. End-to-end live test, then go live

Sign up with a real email + password, confirm the license key shows on
the Done screen and on `/account`, confirm `/dashboard` works (lessons +
AI chat). When ready: flip `TESTING_FREE=false` on Render and
`VITE_TESTING_PHASE=false` on Vercel (step 2/3 above), then go through
`/checkout` for real — pay the actual KES 2,000 yourself via M-Pesa as
the live-mode test (IntaSend live mode has no fake sandbox once keys are
live, so this is the standard way to validate a live integration).
Confirm: payment completes at the real price, license key generates,
`/account` and `/dashboard` both work. If all of that passes, you're live.

#### Deferred, not blocking

- **Custom domain + Resend domain verification** — originally needed to fix
  OTP delivery (Resend's shared `onboarding@resend.dev` sender only
  delivers to the account's own verified email until a custom domain is
  verified). Moot now: sign-in uses real passwords, not emailed codes, so
  nothing in the active flow depends on email deliverability. The
  post-purchase "here's your license key" confirmation email still goes
  through Resend and will silently fail to reach anyone but the account
  owner until a domain is verified (wrapped in `.catch`, so it never blocks
  checkout — the license key already shows directly in the app). Worth
  fixing later for polish/branding, not a blocker. No domain has been
  purchased — deliberately deferred while every other piece of
  infrastructure stays on a free tier with zero recurring cost.
- **Africa's Talking production KYC** — SMS stays sandbox; fully unused
  now (OTP-via-SMS was the only caller, and OTP is no longer wired into
  any active flow).
- **ODPC formal registration** — still correctly deferred until KES 5M
  turnover or 10+ staff.
- **Single Business Permit** — county-level, separate from the BRS name
  registration already done; worth doing but not code-related.

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

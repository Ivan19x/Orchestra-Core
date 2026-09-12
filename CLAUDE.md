# Project: Orchestra-Core — financial education for Kenya

> Single source of truth for this project. Update it whenever something
> meaningful changes.

---

## Who's building this

Ivan — 21, BBIT student at Strathmore University (Nairobi, Kenya), Year 2.
Building solo on a personal laptop. Career interests: Product Management /
Business Analysis / Tech Sales in Kenya's fintech sector, eventual goal of
founding his own business. Separately runs CYRION, a more technical personal
project. Orchestra-Core is a distinct, public-facing product.

---

## What this project is — as of 3 September 2026

**A website that sells access to a written financial-education curriculum.**
80 lessons across nine series, read in the browser. One-time payment by M-Pesa.
Kenya first.

**On the price:** KES 200 is a *testing-stage* price. The intended price is
KES 2,000. Because of that, **never hardcode a price in copy** — always render
`{PRICE_LABEL}` from `src/lib/pricing.ts`, which reads `VITE_PRICE_KES`. Raising
the price is then a two-variable change with no code edit: `VITE_PRICE_KES` on
Vercel (displayed) and `PRICE_KES` on Render (charged). They must always match.

That is the whole product. It is deliberately smaller than it used to be.

### What was removed, and why

Three things were cut in September 2026 to get to something shippable:

| Removed | Why | Where it went |
|---|---|---|
| **The AI coach** (Ollama, qwen2.5, RAG, tool-calling, `/ask`, `/try`) | Ivan wants to build his own model later rather than ship someone else's. Nothing on the site mentions AI now. | `recycle/` |
| **The desktop + Android apps** (Electron, Capacitor, auto-update, deep links, CI release pipeline) | Website-only focus. The app comes later. | `recycle/` |
| **The donation / support page** (personal M-Pesa number, supporter names) | Not wanted. Route `/support` now redirects to `/about`. | `recycle/` |
| **IntaSend** (payment aggregator) | Replaced by a direct Safaricom Daraja integration — money goes straight to Ivan's own Paybill/Till, no middleman. | deleted |

`recycle/` is gitignored: the code still exists on disk for when the app and AI
come back, but it is not on GitHub and not in the build.

**Do not re-add AI features, app download links, or donation UI** unless Ivan
asks. They were removed on purpose.

---

## Brand identity

**Name: Orchestra-Core.** All other candidate names are retired (Compass,
Cyrion, Dira, Fenwa, Doutdes, IIMITI — do not revisit).

The Latin motto *"Inter se pecuniarie adiuvantes"* belonged to the support page
and is retired with it.

---

## Design system — maroon & white

| Token | Hex | Use |
|---|---|---|
| Primary maroon | `#7A2330` | CTAs, icons, price, active states |
| White | `#FFFFFF` | Page background |
| Blush/cream | `#FBF1EE` | Alternating "pause point" sections |
| Divider | `#F0E0DD` | Borders, separators |
| Dark text | `#2B2320` | Headings |
| Muted text | `#7A6C68` | Body / secondary |
| Faint text | `#A39590` | Footer / fine print |

Typography: clean sans-serif; headings medium weight (500), never heavy. Serif
(`font-serif`) for display headlines. Vibe: warm, academic-premium — not fintech
blue.

**Dark mode** is driven entirely by these tokens. `.dark` in `src/index.css`
redefines them. Because every component uses semantic classes (`bg-background`,
`bg-blush`, `text-foreground`, `text-warm-muted`, `border-border`), dark mode
cascades automatically. **Keep using those tokens — never hardcode `bg-white` or
a hex**, or new UI won't theme. Default is light; the choice persists in
`localStorage` (`oc_theme`) and is applied pre-paint by an inline script in
`index.html`. Hook: `src/lib/theme.ts`; toggle: `ThemeToggle.tsx`.

---

## Live deployments

| Service | URL | Platform |
|---|---|---|
| Website | https://orchestra-core.vercel.app | Vercel (auto-deploys on push to main) |
| API | https://orchestra-core.onrender.com | Render (auto-deploys on push to main) |
| Repo | https://github.com/Ivan19x/Orchestra-Core | main branch |

Full deployment and go-live instructions: [`docs/SETUP.md`](docs/SETUP.md).

---

## Website pages

| Route | What it is |
|---|---|
| `/` | Hero, three value props, the three free starter lessons, price, CTA |
| `/how-it-works` | Curriculum / Kenya-first / one payment |
| `/lessons` | The full nine-series programme, searchable. Free badge on starters, Premium (lock) on the rest |
| `/lessons/:code` | The reader. `:code` is `S<series>M<module>`, e.g. `/lessons/S1M1` |
| `/pricing` | One card, the price, benefits, and the 5 purchase-decision questions |
| `/faq` | "Questions people ask" — the everyday practical questions, in four groups |
| `/checkout` | Two steps: create account → pay by M-Pesa STK push |
| `/signup` · `/login` | Email + password |
| `/forgot-password` · `/reset-password` | Emailed 10-minute reset link |
| `/account` | Access key, dashboard link, sign out |
| `/dashboard` | The signed-in learning space: whole library by series, budget tool |
| `/about` · `/privacy` · `/terms` | Story, DPA-compliant policy, ToS |

Retired routes `/try`, `/ask`, `/download`, `/support` redirect rather than 404.

**Division of copy** (set September 2026, keep it):

- **`/about` is the story** — why this exists, in Ivan's first-person voice. Never
  a Q&A. The thesis: people are told to pick one lane and money gets deferred to
  "later"; there is always a path forward and money is the tool every path runs
  on.
- **`/faq` is the everyday questions** — light and practical (what do I get, how
  do I pay, refunds, passwords). The long pitch-style Q&A about competitors,
  credentials and defensibility is **for pitching, not for the website**.
- **No competitors are named anywhere on the site**, and no superlative claims
  ("the first", "the only", "the best"). Verified clean — keep it that way.

Global nav: sticky header, logo left, links centre (How it works · Lessons ·
Pricing · About), theme toggle + auth CTA right. `/faq` is linked from the
footer, from `/pricing`, and from the homepage — deliberately not in the nav. Signed out → "Get started —
free" → `/signup`. Signed in → "Open dashboard".

---

## Access model

Three states, enforced in `src/pages/Lesson.tsx`:

1. **Anonymous** → can browse the library, cannot read anything. Sees a
   create-a-free-account gate.
2. **Free account** (`session.paid === false`) → can read the one `free: true`
   lesson in each series (9 of them).
3. **Paid** (`session.paid === true`) → everything.

`has_paid` in the database is the single source of truth; the JWT carries it and
`/api/auth/me` refreshes it.

---

## The content — 80 lessons, nine series

All lessons live in `src/content/lessons/` as `S<series>M<module>.md`. **This is
the product.** Adding one is dropping in a file and pushing — no code changes.
Format and rules: [`CONTENT-README.md`](CONTENT-README.md).

| Series | Title | Modules |
|---|---|---|
| 1 | Money Basics | 8 |
| 2 | Adult Life Money | 10 |
| 3 | Smart Money | 12 |
| 4 | Kenya Money | 8 |
| 5 | Teenager to Adult | 8 |
| 6 | Psychology of Money | 6 |
| 7 | Home & Household | 9 |
| 8 | Investing & Saving | 10 |
| 9 | Family & Parenting | 9 |

Module 1 of each series is `free: true`. Everything else is premium.

`src/lib/curriculum.ts` holds the *plan* (the module titles shown for anything
not yet written). Edit it only to change the plan — never to publish a lesson.

### How lessons are loaded (important)

Deliberately split in two:

- **The catalogue** (title, series, module, free, minutes, summary) is built at
  build time by the `virtual:lesson-index` Vite plugin in `vite.config.ts`. It's
  small and every page needs it, so it ships in the main bundle.
- **The bodies** are separate chunks, fetched one at a time by
  `loadLessonBody()` in `src/lib/lessons.ts`.

This matters: bundling all 80 bodies eagerly put ~500KB of prose in the first
page load. The split took the initial download from 362KB to 93KB gzipped, and
it stays flat as lessons are added. **Don't switch the body glob back to
`eager: true`.**

---

## Technical architecture

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite, Tailwind, React Router v6 |
| Markdown | react-markdown + remark-gfm (tables), lazy-loaded with the reader |
| API | Express (`backend/`), deployed on Render |
| Database | Supabase (managed PostgreSQL) |
| Auth | Email + bcrypt password → 30-day JWT in `localStorage` (`oc_token`) |
| Payments | Safaricom Daraja — M-Pesa STK Push, direct |
| Email | Gmail SMTP via app password (Resend as fallback) |

Every piece runs on a genuinely free tier. That is a hard constraint while
bootstrapping, not a preference — check for a free path before recommending any
paid service.

### Key files

```
src/
├── pages/            one file per route
│   ├── Lesson.tsx    the reader + the signup/paywall gates
│   ├── Checkout.tsx  account creation → M-Pesa STK push → polling
│   └── Dashboard.tsx signed-in library
├── components/orchestra-core/
│   ├── Nav, Footer, SiteLayout, Logo, ThemeToggle, ScrollToTop
│   ├── LessonCard, LessonArticle (header + markdown body + skeleton)
│   ├── SignupForm    shared by /signup and checkout step 1
│   ├── StreakBadge, BudgetBuilderCard
├── lib/
│   ├── lessons.ts    catalogue (build-time) + loadLessonBody (lazy)
│   ├── curriculum.ts the nine-series plan
│   ├── session.ts    JWT storage + useSession()
│   ├── api.ts        typed fetch wrapper
│   ├── pricing.ts    PRICE_KES / PRICE_LABEL
│   └── theme.ts      light/dark
└── content/lessons/  the 80 lessons

backend/
├── index.mjs
├── routes/auth.mjs      signup, login, me, request-reset, reset-password
├── routes/payment.mjs   initiate, status, callback
└── lib/
    ├── daraja.mjs       OAuth, STK push, STK query, callback parsing
    ├── db.mjs           all Supabase queries
    ├── notify.mjs       Gmail/Resend email
    ├── password.mjs     bcrypt
    └── license.mjs      OC-XXXX… access keys

vite.config.ts       includes the lesson-index plugin
docs/SETUP.md        deployment + go-live
recycle/             gitignored: AI, Electron, Android, donations, old scaffold
```

---

## Payments — how it actually works

Direct Safaricom Daraja integration. No aggregator.

1. `/checkout` step 1 creates the account (`POST /api/auth/signup`) — **before**
   any money moves, so a customer can never pay and have no way back in.
2. Step 2 posts to `POST /api/payment/initiate` with the phone number. The API
   creates a `pending` payments row, calls Daraja STK Push, and stores the
   returned `CheckoutRequestID`.
3. The customer gets the PIN prompt on their phone.
4. **Two independent paths** can complete the payment, and either is enough:
   - Safaricom POSTs to `/api/payment/callback/:secret` (fast).
   - The browser polls `/api/payment/status/:txRef`, which asks Daraja directly
     via STK Query (authoritative).

   This redundancy is on purpose — a lost callback must never leave a paying
   customer locked out. `completePayment()` only ever transitions a row that is
   still `pending`, so whichever path wins, the licence key is issued once.
5. On success: `users.has_paid = true`, an access key is generated, and a
   receipt email goes out.

**Security notes.** Daraja does not sign its callbacks, so: the callback URL
carries an unguessable secret path segment; the `CheckoutRequestID` must match a
payment we created; and the paid amount is checked against the expected amount
before access is granted.

### Backend environment variables

See [`backend/.env.example`](backend/.env.example) — it documents every one,
including sandbox values. The two that must stay in sync across hosts:

- `PRICE_KES` (Render) — what is charged
- `VITE_PRICE_KES` (Vercel) — what is displayed

### Database

Two tables — `users` and `payments`. Schema and migrations:
[`backend/supabase-schema.sql`](backend/supabase-schema.sql). Row-level security
is enabled with no permissive policy; the API uses the `service_role` key, which
bypasses RLS, so a leaked public key still reads nothing.

---

## Business model

**One-time payment** (KES 200 while testing, KES 2,000 intended). No
subscriptions. Unlocks all 80 lessons plus everything added later.

Revenue layers: direct sales (primary); content marketing (every lesson is a
short-form video script); B2B to SACCOs/employers/universities much later.

---

## Legal / regulatory (Kenya)

- **CMA:** strictly education. General, impersonal content only — never
  personalized buy/sell advice on specific securities.
- **Data Protection Act 2019:** `/privacy` and `/terms` are live and current.
  ODPC registration not required until KES 5M turnover or 10+ staff.
- **Business registration:** BRS business name "Orchestra-Core" is registered.
  A county Single Business Permit is separate and still outstanding.
- **Consumer Protection Act 2012:** `/terms` §5–6 cover the internet-agreement
  disclosures and the refund position.

---

## Current status

**Done:** all 80 lessons written and live on the site · the three-tier access
model · Daraja M-Pesa payments · accounts, login, password reset · dark mode ·
legal pages · bundle split so the site stays fast as lessons are added.

**To do before first sale** — all of it dashboard work, no code needed. Follow
[`docs/SETUP.md`](docs/SETUP.md) §5:

1. Run the Supabase schema; put the keys on Render.
2. Create the Daraja app; test in sandbox.
3. Apply to Go Live on Daraja; swap in production credentials.
4. Cheap live test at `PRICE_KES=1`, then set both price vars back to `200`.
5. Add an UptimeRobot monitor so Render's free tier doesn't sleep (§6).

**Later:** custom domain · the AI coach (Ivan's own model) · the desktop and
Android apps · B2B licensing.

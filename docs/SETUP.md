# Orchestra-Core — setup and go-live guide

Everything needed to take this from a repository to a website that takes real
money. Work through it in order; each part says what to do, where, and how to
tell it worked.

There are four moving pieces:

| Piece | What it is | Where it runs | Cost |
|---|---|---|---|
| Website | The React site people visit | Vercel | Free |
| API | Accounts + payments | Render (or Fly.io) | Free |
| Database | Accounts, payment records | Supabase | Free |
| M-Pesa | Takes the money | Safaricom Daraja | Free to integrate |

---

## 1. Database (Supabase)

1. Go to **supabase.com** → sign in with GitHub → **New project**.
   - Name: `orchestra-core`
   - Database password: generate one and save it somewhere safe.
   - Region: **West EU (Ireland)** — closest of the free regions to Kenya.
2. Wait for the project to finish provisioning (~2 minutes).
3. Open **SQL Editor** → **New query**. Paste the entire contents of
   [`backend/supabase-schema.sql`](../backend/supabase-schema.sql) and press
   **Run**. It creates the `users` and `payments` tables and is safe to re-run.
4. Go to **Project Settings → API** and copy two values:
   - **Project URL** → this is `SUPABASE_URL`
   - **`service_role` secret** → this is `SUPABASE_SERVICE_KEY`

> The `service_role` key bypasses all database security. It belongs only in the
> API's environment variables — never in the website, never in the repo, never
> in a screenshot.

**How to tell it worked:** Table Editor shows `users` and `payments`, both empty.

---

## 2. M-Pesa (Safaricom Daraja)

This is a direct integration. Money goes into your own Paybill or Till — there
is no middleman taking a cut.

### 2a. Create the Daraja app

1. Go to **developer.safaricom.co.ke** and create an account.
2. **My Apps → Add a new app.** Tick **Lipa na M-Pesa Sandbox** and **M-Pesa
   Sandbox**. Name it `Orchestra-Core`.
3. Open the app and copy the **Consumer Key** and **Consumer Secret**.

### 2b. Test it in the sandbox first

Use these in your API environment. The sandbox shortcode and passkey below are
Safaricom's public test values — they are meant to be shared:

```
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=<your consumer key>
MPESA_CONSUMER_SECRET=<your consumer secret>
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_TRANSACTION_TYPE=CustomerPayBillOnline
```

In sandbox, use the **test MSISDN** shown on the Daraja "Simulate" page (usually
`254708374149`). Real phones don't get prompts in sandbox.

### 2c. The callback URL

Safaricom sends the payment result to a URL you control. It **must be public
HTTPS** — localhost will not work.

1. Generate a random secret:
   ```sh
   node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
   ```
2. Set both of these on your API host, using that same secret in both:
   ```
   MPESA_CALLBACK_SECRET=<the random string>
   MPESA_CALLBACK_URL=https://orchestra-core.onrender.com/api/payment/callback/<the random string>
   ```

The secret in the path is what stops a stranger from posting a fake "payment
succeeded" to your API — Safaricom does not sign its callbacks. The API also
independently re-checks every payment with Safaricom before unlocking an
account, so a forged callback alone can never grant access.

**Testing the callback locally:** run `npx localtunnel --port 3001` (or
`ngrok http 3001`) and use the https URL it gives you as the callback host.

### 2d. Going live

1. In Daraja, apply to **Go Live** (menu at the top). You will need your
   registered Paybill or Till number and business details. Approval typically
   takes a few days.
2. Once approved you get **production** credentials. Change:
   ```
   MPESA_ENV=production
   MPESA_CONSUMER_KEY=<production key>
   MPESA_CONSUMER_SECRET=<production secret>
   MPESA_SHORTCODE=<your Paybill, or your Store number if using a Till>
   MPESA_PASSKEY=<production Lipa na M-Pesa passkey>
   ```
3. **If you use a Till (Buy Goods) rather than a Paybill**, also set:
   ```
   MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline
   MPESA_PARTY_B=<your Till number>
   ```
   with `MPESA_SHORTCODE` set to the Store/Head-Office number that owns the
   passkey. For a Paybill, leave `MPESA_PARTY_B` unset.

**How to tell it worked:** a real phone gets an STK prompt and, after entering a
PIN, the site unlocks by itself within a few seconds.

---

## 3. The API (Render)

1. Push this repository to GitHub (it already is).
2. Go to **render.com** → **New → Web Service** → connect the repo.
3. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Add every environment variable below (**Environment** tab):

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `SUPABASE_URL` | from step 1 |
| `SUPABASE_SERVICE_KEY` | from step 1 |
| `MPESA_ENV` | `sandbox`, then `production` |
| `MPESA_CONSUMER_KEY` | from step 2 |
| `MPESA_CONSUMER_SECRET` | from step 2 |
| `MPESA_SHORTCODE` | from step 2 |
| `MPESA_PASSKEY` | from step 2 |
| `MPESA_TRANSACTION_TYPE` | `CustomerPayBillOnline` |
| `MPESA_CALLBACK_SECRET` | from step 2c |
| `MPESA_CALLBACK_URL` | from step 2c |
| `PRICE_KES` | `200` |
| `GMAIL_USER` | the Gmail address that sends receipts |
| `GMAIL_APP_PASSWORD` | 16-character Google app password (see below) |
| `FRONTEND_URL` | `https://orchestra-core.vercel.app` |
| `CORS_ORIGINS` | `https://orchestra-core.vercel.app` |

**Gmail app password:** the account needs 2-Step Verification on, then
myaccount.google.com → Security → App passwords → generate one. Paste it with
no spaces. This is what lets purchase receipts and password-reset emails reach
any address for free.

**How to tell it worked:** open
`https://orchestra-core.onrender.com/api/health` — it should return
`{"ok":true}`.

> ⚠️ **The Render free tier sleeps after 15 minutes of no traffic**, and the
> first request afterwards takes ~50 seconds to wake it. See section 6 for how
> to deal with that — it matters more than it sounds.

---

## 4. The website (Vercel)

1. Go to **vercel.com** → **Add New → Project** → import the repo.
2. Framework preset: **Vite**. Leave the build settings alone — `vercel.json`
   already sets the build command, output directory, and the SPA rewrite that
   makes `/lessons/S1M1` work on a hard refresh.
3. Add environment variables (**Settings → Environment Variables**), for all
   environments:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://orchestra-core.onrender.com` |
| `VITE_PRICE_KES` | `200` |

4. **Deploy.**

> `VITE_*` variables are baked in at build time. Changing one requires a fresh
> deploy — Vercel → Deployments → ⋯ → **Redeploy**. Changing the price means
> changing it in **two** places: `VITE_PRICE_KES` here (what people see) and
> `PRICE_KES` on Render (what they're charged). Keep them equal.

**How to tell it worked:** the homepage loads, `/lessons` shows nine series, and
signing up creates an account you can see in the Supabase `users` table.

---

## 5. Going live — the checklist

Do these in order, and stop at the first one that fails.

1. **Sandbox end-to-end.** Sign up with a real email. Confirm the account
   appears in Supabase. Pay with the Daraja test number. Confirm `payments`
   shows `completed`, `users.has_paid` flips to `true`, and a premium lesson
   opens.
2. **Password reset.** Use "Forgot password" and confirm the email arrives.
3. **Switch to production credentials** (step 2d) and set `MPESA_ENV=production`.
4. **Cheap live test.** Set `PRICE_KES=1` on Render and `VITE_PRICE_KES=1` on
   Vercel, redeploy the website, and buy it yourself with your own phone for
   KES 1. Confirm the money arrives in your Paybill/Till and access unlocks.
   Daraja has no sandbox once you are live, so paying yourself is the standard
   way to validate a live integration.
5. **Set the real price back:** `PRICE_KES=200` and `VITE_PRICE_KES=200`, and
   redeploy the website.
6. **Check the legal pages** at `/terms` and `/privacy` still describe what you
   actually do.

---

## 6. Keeping the website running

The thing most likely to cost you sales is not a bug — it is **Render's free
tier going to sleep**. A visitor who clicks "Create account" on a cold API waits
close to a minute, and most people leave. Fix it with one of these:

**Option A — a free uptime pinger (recommended, 5 minutes of work).**
Sign up at **UptimeRobot** (uptimerobot.com, free for 50 monitors) and add an
HTTP monitor for `https://orchestra-core.onrender.com/api/health` every 5
minutes. That keeps the API awake *and* emails you the moment it goes down —
which is the real value: you find out before a customer does. **cron-job.org**
is a free alternative.

**Option B — pay Render $7/month** for an instance that never sleeps. Worth it
once sales cover it; not before.

**Option C — move the API to Fly.io.** Its free allowance runs a small
always-on machine, and `backend/Dockerfile` is already there for it. More setup,
no monthly cost.

Also worth doing, roughly in this order:

- **Watch the money, not the server.** The `payments` table is your ledger. A
  row stuck at `pending` with a real M-Pesa code means someone paid and did not
  get access — check it weekly at first. Supabase → Table Editor → `payments`,
  sort by `created_at`.
- **Back up the database.** Supabase's free tier keeps 7 days of backups. Once a
  month, Table Editor → `users` → Export as CSV, and keep it somewhere safe.
  Your customer list is the one thing you genuinely cannot rebuild.
- **A custom domain** (~KES 1,500/year for a `.co.ke`). Point it at Vercel and
  update `FRONTEND_URL`, `CORS_ORIGINS`, and `MPESA_CALLBACK_URL`. Not urgent,
  but `orchestra-core.vercel.app` on a payment page costs you some trust.
- **Keep publishing lessons.** Every new `.md` file is a page that can be found
  on Google and a script for a short video. It is the cheapest growth you have.

---

## 7. Where things live in the code

| If you want to change… | Edit |
|---|---|
| A lesson, or add one | `src/content/lessons/S<series>M<module>.md` |
| The list of planned modules | `src/lib/curriculum.ts` |
| Which lessons are free | the `free:` line in each lesson's frontmatter |
| The displayed price | `VITE_PRICE_KES` on Vercel |
| The charged price | `PRICE_KES` on Render |
| Payment logic | `backend/routes/payment.mjs`, `backend/lib/daraja.mjs` |
| Accounts / login | `backend/routes/auth.mjs` |
| Colours and theme | `src/index.css` and `tailwind.config.ts` |

# Trail Tracker

A merit badge companion app for Scouts BSA. Troop leaders manage a roster;
scouts get a private, code-based login with **no email, phone, or PII**
beyond a first name + last initial.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project (free
   tier is plenty to start).
2. In **Project Settings → API**, copy the **Project URL** and **anon
   public** key.
3. Copy `.env.example` to `.env` and paste those two values in.

## 2. Run the database migration

1. In the Supabase dashboard, open the **SQL Editor**.
2. Paste the entire contents of `supabase/001_trail_tracker_schema.sql` and
   run it. This creates the `troops`, `scouts`, `scout_badges`, and
   `claim_attempts` tables, row-level security policies, and the
   `create_scout` / `claim_scout` / `reset_scout_code` functions.

## 3. Enable anonymous sign-ins (required for scout login)

Scouts authenticate via Supabase's **anonymous auth**, then link that
session to their scout record with their access code. This is off by
default:

1. Go to **Authentication → Sign In / Providers**.
2. Enable **Allow anonymous sign-ins**.

## 4. Configure leader auth (email + optional Google/Apple)

Email/password works out of the box. For Google or Apple sign-in:

1. Go to **Authentication → Sign In / Providers**.
2. Enable **Google** and/or **Apple**, following Supabase's setup guide for
   each (you'll need OAuth credentials from Google Cloud Console / Apple
   Developer).
3. If you skip this, just remove or leave unused the "Continue with
   Google/Apple" buttons in `src/screens/LeaderAuth.jsx` — email/password
   sign-in still works either way.

Supabase sends its own confirmation and password-reset emails
automatically — no extra setup needed, though you can customize the
templates under **Authentication → Email Templates**.

## 5. Local development

```bash
npm install
npm run dev
```

Visit the local URL Vite prints (usually `http://localhost:5173`).

## 6. Hosting (recommended: Vercel)

This is a static Vite app — it builds to plain HTML/CSS/JS with no server
required, so any static host works. Vercel is the simplest:

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import
   the repo.
3. Vercel auto-detects Vite. Before deploying, add your environment
   variables under **Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Vercel gives you a free `*.vercel.app` URL immediately, and you
   can attach a custom domain later under **Settings → Domains**.

**Alternatives**, if you'd rather use something else — all work the same
way (build command `npm run build`, output directory `dist`, same two env
vars):
- **Netlify** — drag-and-drop the `dist` folder after `npm run build`, or
  connect the GitHub repo for auto-deploys.
- **Cloudflare Pages** — similar GitHub-connected flow, generous free tier.

You do **not** need to host anything for the backend — Supabase runs the
database, auth, and API for you.

## How login works

- **Troop leader**: real account (email/password, or Google/Apple).
  Creates a troop, adds scouts by first-name + last-initial only, and gets
  a one-time access code to hand each scout.
- **Scout**: no email or password. Enters their code once per device; the
  app links an anonymous Supabase session to their scout record.
  Re-entering the code on a new device re-links it there. If a code is
  lost, only the troop leader can issue a new one (**View / edit → Reset
  code** on the dashboard).

## Known limitations / next steps

- **Rate limiting** on code-guessing is enforced in the database (5
  attempts per 10 minutes per caller), which is solid but not
  bulletproof — for extra hardening at scale, consider fronting `claim_scout`
  with a Supabase Edge Function that adds IP-based throttling too.
- **Troop-leader read-only "view other troops"** role isn't built — each
  leader account only sees their own troop. If you want multiple leaders
  per troop (e.g. assistant scoutmasters), that's an additive RLS policy
  change, not a schema change.
- Badge catalog (`src/data/trail-tracker-data.json`) is static. BSA
  occasionally adds/retires badges — review periodically and update the
  JSON file directly; no migration needed since it's not stored in the
  database.

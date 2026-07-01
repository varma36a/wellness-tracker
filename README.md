# Wellness Tracker

A personal web app to track **emotions**, **behavior patterns**, **daily checklists**, and **self-reflections** — with secure login and cloud database persistence.

## Why Supabase? (Database Recommendation)

For a **personal, lifetime-use** tracker, we use **[Supabase](https://supabase.com)** (managed PostgreSQL):

| Option | Cost | Best for | Lifetime fit |
|--------|------|----------|--------------|
| **Supabase (recommended)** | **Free tier** — 500 MB DB, unlimited API requests for personal use | Personal apps with auth + SQL | Excellent — data persists as long as project is active; upgrade only if you outgrow free tier (~$25/mo) |
| Turso (SQLite edge) | Free — 9 GB total | Edge SQLite apps | Good — smaller ecosystem for auth |
| Neon PostgreSQL | Free — 0.5 GB | Serverless Postgres | Good — no built-in auth |
| Firebase | Free tier, then usage-based | Real-time mobile apps | OK — can get costly at scale |
| Self-hosted SQLite | $0 | Local-only | Poor — no cloud backup unless you manage it |

**Supabase wins** because it bundles:
- PostgreSQL (reliable, queryable, exportable)
- Built-in email/password authentication
- Row Level Security (your data is isolated to your account)
- Generous free tier for one person's journal entries for decades

---

## Features

- **Mood & behavior logging** — score (1–10), emotions, energy, sleep, triggers, behavior notes
- **Daily checklist** — customizable wellness habits with date-based completion tracking
- **Self-reflections** — journal with prompts, tags, and mood-at-writing
- **Dashboard overview** — 7-day mood trend, checklist progress, quick actions
- **Secure login** — email/password auth via Supabase; RLS ensures only you see your data

---

## Setup (5 minutes)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free).
2. Click **New project** → choose a name and password.
3. Wait for the project to provision (~2 min).

### 2. Run the database schema

1. In Supabase Dashboard → **SQL Editor** → **New query**.
2. Paste the contents of `supabase/schema.sql`.
3. Click **Run**.

### 3. Configure authentication

1. Go to **Authentication** → **Providers** → ensure **Email** is enabled.
2. For personal use, you can disable email confirmation under **Authentication** → **Settings** → turn off "Confirm email" (optional, speeds up signup).

### 4. Configure environment variables

```bash
cd ~/wellness-tracker
cp .env.local.example .env.local
```

Edit `.env.local` with your project credentials from **Settings** → **API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### 5. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Create your account** → start tracking.

---

## Deploy (free on Vercel)

### 1. Push is on GitHub

Repo: **https://github.com/varma36a/wellness-tracker**

### 2. Deploy on Vercel (free)

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. **Import** the `wellness-tracker` repository.
3. Framework preset: **Next.js** (auto-detected).
4. Add **Environment Variables** before deploying:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon public key (`eyJ...`) from Supabase → Settings → API |

5. Click **Deploy** — free Hobby plan is enough for personal use.

### 3. Configure Supabase for your live URL

After deploy, copy your Vercel URL (e.g. `https://wellness-tracker-xxx.vercel.app`).

In **Supabase → Authentication → URL Configuration**:

- **Site URL:** your Vercel URL
- **Redirect URLs:** add `https://your-app.vercel.app/**`

### 4. Run journal events migration (if not done)

Supabase → SQL Editor → run `supabase/migrations/add_journal_events.sql`

---

## Deploy (optional — CLI)

Deploy to [Vercel](https://vercel.com) for free:

```bash
npm run build   # verify locally first
```

Push to GitHub, import in Vercel, and add the same `NEXT_PUBLIC_SUPABASE_*` env vars.

---

## Project structure

```
wellness-tracker/
├── supabase/schema.sql       # PostgreSQL tables + RLS policies
├── src/
│   ├── app/
│   │   ├── login/            # Sign in
│   │   ├── signup/           # Register + seed default checklist
│   │   └── dashboard/        # Overview, mood, checklist, reflections
│   ├── components/           # Navigation
│   └── lib/supabase/         # Auth client (browser + server)
└── .env.local.example
```

---

## Data export (your data, forever)

Supabase stores standard PostgreSQL. You can export anytime:

- **Dashboard** → **Database** → **Backups** (paid plans) or use SQL:
  ```sql
  SELECT * FROM mood_entries;
  SELECT * FROM reflections;
  ```
- Or use `pg_dump` with your connection string from **Settings** → **Database**.

Your wellness data is never locked in — it's yours.

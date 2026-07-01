# Deploy from `.env.local` (no manual Vercel paste)

All secrets live in **one file**: `.env.local` (never committed to git).

## 1. Configure locally

```bash
cd ~/wellness-tracker
cp .env.local.example .env.local   # skip if you already have it
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://pxlamtbiernzrobwglwo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your full anon key
```

Get the anon key: **Supabase → Settings → API → anon public**

Verify:

```bash
npm run env:check
```

## 2. Run locally

```bash
npm run dev
```

Next.js loads `.env.local` automatically.

## 3. Deploy to Vercel from `.env.local`

```bash
npx vercel login          # once
npm run env:sync-vercel   # pushes .env.local → Vercel
npm run deploy            # production deploy
```

Or after `env:sync-vercel`, redeploy from the Vercel dashboard.

## 4. Supabase auth URLs (after first deploy)

Supabase → **Authentication → URL Configuration**

- **Site URL:** your Vercel URL
- **Redirect URLs:** `https://your-app.vercel.app/**`

## 5. Journal events table

Run once in Supabase SQL Editor: `supabase/migrations/add_journal_events.sql`

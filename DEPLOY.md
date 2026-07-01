# One-time setup for auto-deploy on every push to main

## Step 1 — Import on Vercel (web, ~2 min)

1. Open: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvarma36a%2Fwellness-tracker
2. Sign in with GitHub → Import `wellness-tracker`
3. Add environment variables **before** first deploy:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pxlamtbiernzrobwglwo.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key from Supabase → Settings → API |

4. Click **Deploy**

## Step 2 — Supabase auth URLs

After deploy, copy your Vercel URL (e.g. `https://wellness-tracker-xxx.vercel.app`).

Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** `https://your-app.vercel.app/**`

## Step 3 — GitHub Actions auto-deploy (optional)

Get these from Vercel → Project → **Settings → General**:

- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Create a token: Vercel → **Account Settings → Tokens**

Add GitHub secrets at  
https://github.com/varma36a/wellness-tracker/settings/secrets/actions

| Secret | Value |
|--------|--------|
| `VERCEL_TOKEN` | Your Vercel token |
| `VERCEL_ORG_ID` | From project settings |
| `VERCEL_PROJECT_ID` | From project settings |

Every push to `main` will auto-deploy.

## Step 4 — Journal events table

If not done yet, run in Supabase SQL Editor:

`supabase/migrations/add_journal_events.sql`

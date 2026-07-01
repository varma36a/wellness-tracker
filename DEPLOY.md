# Deploy to Vercel (free, auto-deploy on push)

## 1. Connect GitHub to Vercel (one-time)

1. Open https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvarma36a%2Fwellness-tracker
2. Sign in with GitHub → Import the repo
3. Add **Environment Variables** before the first deploy:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pxlamtbiernzrobwglwo.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key from Supabase → Settings → API |

4. Click **Deploy**

After this, **every push to `main` auto-deploys** via Vercel's Git integration. No GitHub Actions or tokens needed.

## 2. Manual redeploy (optional)

Vercel Dashboard → **Deployments** → **Redeploy** (use if you changed env vars).

Or locally:

```bash
npx vercel login   # once
npx vercel --prod
```

## 3. Supabase auth URLs

Supabase → **Authentication → URL Configuration**

- **Site URL:** your Vercel URL
- **Redirect URLs:** `https://your-app.vercel.app/**`

## 4. Local development

```bash
cp .env.local.example .env.local
# edit .env.local with the same Supabase values
npm run dev
```

## 5. Journal events table

Run once in Supabase SQL Editor: `supabase/migrations/add_journal_events.sql`

## Troubleshooting

**GitHub Actions error `--token`, but it's missing a value**  
That workflow was removed. Deploys are handled by Vercel directly when the repo is linked in the Vercel dashboard.

**500 MIDDLEWARE_INVOCATION_FAILED**  
Check Supabase env vars are set in Vercel and redeploy.

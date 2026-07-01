#!/usr/bin/env node
import { loadEnvLocal, validateSupabaseEnv } from "./env-utils.mjs";

try {
  const vars = loadEnvLocal();
  const { ok, errors } = validateSupabaseEnv(vars);

  console.log("\n.env.local check\n");

  console.log(`  NEXT_PUBLIC_SUPABASE_URL=${vars.NEXT_PUBLIC_SUPABASE_URL ? "✓ set" : "✗ missing"}`);
  console.log(
    `  NEXT_PUBLIC_SUPABASE_ANON_KEY=${vars.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith("eyJ") ? "✓ valid format" : "✗ not configured"}`
  );

  if (!ok) {
    console.error("\nFix these in .env.local:\n");
    errors.forEach((e) => console.error(`  • ${e}`));
    console.error("\nGet keys from: https://supabase.com/dashboard → Settings → API\n");
    process.exit(1);
  }

  console.log("\n✓ .env.local looks good. Run: npm run dev\n");
} catch (err) {
  console.error(`\n✗ ${err.message}\n`);
  process.exit(1);
}

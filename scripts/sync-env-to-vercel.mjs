#!/usr/bin/env node
/**
 * Push NEXT_PUBLIC_* vars from .env.local to Vercel (no manual dashboard paste).
 */
import { spawnSync } from "child_process";
import { loadEnvLocal, validateSupabaseEnv } from "./env-utils.mjs";

const KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const TARGETS = ["production", "preview", "development"];

function setVercelEnv(name, value, target) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", name, target, "--force"],
    { input: value, encoding: "utf8", stdio: ["pipe", "inherit", "inherit"] }
  );

  if (result.status !== 0) {
    throw new Error(`Failed to set ${name} for ${target}`);
  }
}

try {
  const vars = loadEnvLocal();
  const { ok, errors } = validateSupabaseEnv(vars);

  if (!ok) {
    console.error("\n.env.local is not ready:\n");
    errors.forEach((e) => console.error(`  • ${e}`));
    console.error("\nEdit .env.local first, then run this command again.\n");
    process.exit(1);
  }

  console.log("\nSyncing .env.local → Vercel…\n");

  for (const target of TARGETS) {
    for (const key of KEYS) {
      console.log(`  ${key} → ${target}`);
      setVercelEnv(key, vars[key], target);
    }
  }

  console.log("\n✓ Done. Run: npm run deploy\n");
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  console.error("\nLog in first: npx vercel login\n");
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Read variables from .env.local (single source of truth).
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

export function loadEnvLocal() {
  if (!existsSync(envPath)) {
    throw new Error(`Missing ${envPath}. Copy .env.local.example to .env.local and add your Supabase keys.`);
  }

  const vars = {};
  const content = readFileSync(envPath, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
}

export function validateSupabaseEnv(vars = loadEnvLocal()) {
  const url = vars.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = vars.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const errors = [];

  if (!url) errors.push("NEXT_PUBLIC_SUPABASE_URL is missing in .env.local");
  if (!key) errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local");
  if (key === "PASTE_YOUR_ANON_KEY_HERE" || key === "your-anon-key") {
    errors.push("Replace PASTE_YOUR_ANON_KEY_HERE with your real anon key in .env.local");
  }
  if (url?.includes("/rest/v1")) {
    errors.push("Use the base Project URL in .env.local (no /rest/v1/)");
  }
  if (key && !key.startsWith("eyJ")) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY should start with eyJ (anon public key from Supabase → Settings → API)");
  }

  return { url, key, errors, ok: errors.length === 0 };
}

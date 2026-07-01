export function getSupabaseEnv(): { url: string; key: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!rawUrl || !key) return null;
  if (key === "PASTE_YOUR_ANON_KEY_HERE" || key === "your-anon-key") return null;
  if (rawUrl.includes("your-project")) return null;

  const url = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

  if (!url.startsWith("https://") || !url.includes(".supabase.co")) return null;
  if (!key.startsWith("eyJ")) return null;

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

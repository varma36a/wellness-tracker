"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Configuration error");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen blazing-bg">
      <div className="blazing-panel relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-blaze-gold" />
          <span className="text-xl font-semibold">Wellness Tracker</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight drop-shadow-lg">
            Understand your patterns.
            <br />
            Nurture your wellbeing.
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Track emotions, daily habits, and reflections in one private space.
          </p>
        </div>
        <p className="relative text-sm text-white/70">Your data stays yours — encrypted and private.</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="glass-form w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Sparkles className="h-7 w-7 text-blaze-pink" />
            <span className="text-lg font-semibold text-sage-900">Wellness Tracker</span>
          </div>

          <h2 className="text-2xl font-bold text-sage-900">Welcome back</h2>
          <p className="mt-2 text-sage-600">Sign in to your personal wellness journal</p>

          {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "PASTE_YOUR_ANON_KEY_HERE" ||
          !process.env.NEXT_PUBLIC_SUPABASE_URL ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Supabase env vars missing on the server. In Vercel → Settings → Environment
              Variables, add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then redeploy.
            </p>
          ) : null}

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-sage-600">
            First time here?{" "}
            <Link href="/signup" className="font-semibold text-blaze-purple hover:text-blaze-pink">
              Create your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

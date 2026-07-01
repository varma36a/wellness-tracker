"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_CHECKLIST_ITEMS } from "@/lib/types";
import { Sparkles } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const items = DEFAULT_CHECKLIST_ITEMS.map((title, i) => ({
        user_id: data.user!.id,
        title,
        sort_order: i,
      }));
      await supabase.from("checklist_items").insert(items);
    }

    router.push("/dashboard");
    router.refresh();
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
          <h1 className="text-4xl font-bold leading-tight drop-shadow-lg">Start your journey today</h1>
          <p className="mt-4 text-lg text-white/90">
            A private space to log moods, build habits, and reflect on what matters.
          </p>
        </div>
        <p className="relative text-sm text-white/70">Free forever on Supabase&apos;s generous personal tier.</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="glass-form w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Sparkles className="h-7 w-7 text-blaze-pink" />
            <span className="text-lg font-semibold text-sage-900">Wellness Tracker</span>
          </div>

          <h2 className="text-2xl font-bold text-sage-900">Create your account</h2>
          <p className="mt-2 text-sage-600">This is your personal wellness space</p>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
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
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-sage-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blaze-purple hover:text-blaze-pink">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

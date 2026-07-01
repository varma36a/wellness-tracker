"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/pin";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center blazing-bg p-8">
      <div className="glass-form w-full max-w-md">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-sage-600 hover:text-sage-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-blaze-pink" />
          <h1 className="text-2xl font-bold text-sage-900">Forgot password?</h1>
        </div>

        {sent ? (
          <div className="rounded-xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <p className="font-medium">Check your email</p>
            <p className="mt-2">
              We sent a reset link to <strong>{email}</strong>. Click the link to set a new
              password, then sign in again.
            </p>
            <p className="mt-2 text-emerald-700">
              Also check spam. Link expires in about 1 hour.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-sage-600">
              Enter your account email and we&apos;ll send a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="rohit36a@gmail.com"
                />
              </div>
              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

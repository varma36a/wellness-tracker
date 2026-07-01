"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteUrl } from "@/lib/pin";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function ForgotPinPage() {
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
        redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-pin`,
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
          <Sparkles className="h-7 w-7 text-blaze-violet" />
          <h1 className="text-2xl font-bold text-sage-900">Forgot PIN?</h1>
        </div>

        {sent ? (
          <div className="rounded-xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <p className="font-medium">Check your email</p>
            <p className="mt-2">
              We sent a secure link to <strong>{email}</strong>. After verifying your email,
              you can set a new password and create a new 4-digit PIN.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-sage-600">
              For security, PIN recovery uses the same email verification as password reset.
              You&apos;ll set a new password and PIN from the link we send.
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
                {loading ? "Sending…" : "Send recovery link"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-sage-600">
              Only forgot password?{" "}
              <Link href="/forgot-password" className="font-semibold text-blaze-purple">
                Reset password
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

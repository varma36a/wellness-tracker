"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { verifyPin } from "@/lib/pin";
import { PIN_LENGTH } from "@/lib/types";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function PinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setChecking(false);
    }
    checkSession();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: settings } = await supabase
      .from("user_settings")
      .select("pin_hash, pin_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!settings?.pin_enabled || !settings.pin_hash) {
      router.replace("/dashboard");
      return;
    }

    const valid = await verifyPin(pin, user.id, settings.pin_hash);
    if (!valid) {
      setError("Incorrect PIN. Try again.");
      setPin("");
      setLoading(false);
      return;
    }

    document.cookie = `pin_verified=${user.id}; path=/; max-age=86400; SameSite=Lax`;
    router.push("/dashboard");
    router.refresh();
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center blazing-bg">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center blazing-bg p-8">
      <div className="glass-form w-full max-w-sm text-center">
        <Sparkles className="mx-auto mb-4 h-8 w-8 text-blaze-gold" />
        <h1 className="text-2xl font-bold text-sage-900">Enter your PIN</h1>
        <p className="mt-2 text-sm text-sage-600">Quick unlock for your wellness journal</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={PIN_LENGTH}
            required
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))}
            className="input-field text-center text-3xl tracking-[0.6em]"
            placeholder="••••"
          />
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          <button type="submit" disabled={loading || pin.length < PIN_LENGTH} className="btn-primary w-full">
            {loading ? "Verifying…" : "Unlock"}
          </button>
        </form>

        <p className="mt-6 text-sm text-sage-600">
          <Link href="/forgot-pin" className="font-semibold text-blaze-purple hover:text-blaze-pink">
            Forgot PIN?
          </Link>
        </p>
      </div>
    </div>
  );
}

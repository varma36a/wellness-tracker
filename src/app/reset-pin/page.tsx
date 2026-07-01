"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hashPin } from "@/lib/pin";
import { PIN_LENGTH } from "@/lib/types";
import { Sparkles } from "lucide-react";

export default function ResetPinPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Session expired. Request a new recovery link.");
      setLoading(false);
      return;
    }

    const { error: pwError } = await supabase.auth.updateUser({ password });
    if (pwError) {
      setError(pwError.message);
      setLoading(false);
      return;
    }

    const pinHash = await hashPin(pin, user.id);
    const { error: settingsError } = await supabase.from("user_settings").upsert({
      user_id: user.id,
      pin_hash: pinHash,
      pin_enabled: true,
    });

    if (settingsError) {
      setError(settingsError.message);
      setLoading(false);
      return;
    }

    document.cookie = `pin_verified=${user.id}; path=/; max-age=86400; SameSite=Lax`;
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center blazing-bg p-8">
      <div className="glass-form w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-blaze-violet" />
          <h1 className="text-2xl font-bold text-sage-900">Reset password & PIN</h1>
        </div>
        <p className="mb-6 text-sm text-sage-600">
          Set a new password and a new {PIN_LENGTH}-digit PIN for quick access.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="label">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
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
            />
          </div>
          <div>
            <label htmlFor="pin" className="label">
              New {PIN_LENGTH}-digit PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={PIN_LENGTH}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))}
              className="input-field text-center text-2xl tracking-[0.5em]"
              placeholder="••••"
            />
          </div>
          <div>
            <label htmlFor="confirmPin" className="label">
              Confirm PIN
            </label>
            <input
              id="confirmPin"
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={PIN_LENGTH}
              required
              value={confirmPin}
              onChange={(e) =>
                setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))
              }
              className="input-field text-center text-2xl tracking-[0.5em]"
              placeholder="••••"
            />
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Saving…" : "Save password & PIN"}
          </button>
        </form>
      </div>
    </div>
  );
}

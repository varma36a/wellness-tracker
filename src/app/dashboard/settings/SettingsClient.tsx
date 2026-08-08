"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hashPin } from "@/lib/pin";
import { PIN_LENGTH } from "@/lib/types";
import { Shield, ShieldOff } from "lucide-react";

export function SettingsClient({
  initialPinEnabled,
  userId,
}: {
  initialPinEnabled: boolean;
  userId: string;
}) {
  const [pinEnabled, setPinEnabled] = useState(initialPinEnabled);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function savePin(enable: boolean) {
    setSaving(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    if (enable) {
      if (!/^\d{4}$/.test(pin)) {
        setError("PIN must be exactly 4 digits");
        setSaving(false);
        return;
      }
      if (pin !== confirmPin) {
        setError("PINs do not match");
        setSaving(false);
        return;
      }

      const pinHash = await hashPin(pin, userId);
      const { error: upsertError } = await supabase.from("user_settings").upsert({
        user_id: userId,
        pin_hash: pinHash,
        pin_enabled: true,
      });

      if (upsertError) {
        setError(upsertError.message);
        setSaving(false);
        return;
      }

      document.cookie = `pin_verified=${userId}; path=/; max-age=86400; SameSite=Lax`;
      setPinEnabled(true);
      setPin("");
      setConfirmPin("");
      setMessage("PIN enabled. You'll enter it after each login.");
    } else {
      const { error: upsertError } = await supabase.from("user_settings").upsert({
        user_id: userId,
        pin_hash: null,
        pin_enabled: false,
      });

      if (upsertError) {
        setError(upsertError.message);
        setSaving(false);
        return;
      }

      document.cookie = "pin_verified=; Max-Age=0; path=/";
      setPinEnabled(false);
      setMessage("PIN disabled.");
    }

    setSaving(false);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-heading">Security settings</h1>
        <p className="page-subheading">Manage your optional 4-digit PIN</p>
      </div>

      <div className="card max-w-lg space-y-6">
        <div className="flex items-start gap-3">
          {pinEnabled ? (
            <Shield className="mt-0.5 h-5 w-5 text-emerald-600" />
          ) : (
            <ShieldOff className="mt-0.5 h-5 w-5 text-sage-400" />
          )}
          <div>
            <h2 className="font-semibold text-sage-900">App PIN</h2>
            <p className="mt-1 text-sm text-sage-600">
              Optional extra lock after login. Use a 4-digit PIN for quick access.
            </p>
          </div>
        </div>

        {pinEnabled ? (
          <div className="space-y-4">
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              PIN is active. After signing in, you&apos;ll be asked for your PIN.
            </p>
            <button
              onClick={() => savePin(false)}
              disabled={saving}
              className="btn-secondary w-full"
            >
              {saving ? "Disabling…" : "Disable PIN"}
            </button>
            <p className="text-center text-sm text-sage-600">
              Forgot PIN?{" "}
              <a href="/forgot-pin" className="font-semibold text-blaze-purple">
                Recover via email
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label">New {PIN_LENGTH}-digit PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={PIN_LENGTH}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))}
                className="input-field text-center text-2xl tracking-[0.5em]"
                placeholder="••••"
              />
            </div>
            <div>
              <label className="label">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={PIN_LENGTH}
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))
                }
                className="input-field text-center text-2xl tracking-[0.5em]"
                placeholder="••••"
              />
            </div>
            <button
              onClick={() => savePin(true)}
              disabled={saving || pin.length < PIN_LENGTH}
              className="btn-primary w-full"
            >
              {saving ? "Saving…" : "Enable PIN"}
            </button>
          </div>
        )}

        {message && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
        )}
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
      </div>
    </div>
  );
}

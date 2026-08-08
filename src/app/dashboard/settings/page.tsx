import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/auth";
import { SettingsClient } from "./SettingsClient";

async function getPinEnabled(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_settings")
    .select("pin_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.pin_enabled ?? false;
}

export default async function SettingsPage() {
  const user = await getUser();
  const pinEnabled = await getPinEnabled(user!.id);
  return <SettingsClient initialPinEnabled={pinEnabled} userId={user!.id} />;
}

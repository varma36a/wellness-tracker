import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { MoodEntry } from "@/lib/types";
import { MoodClient } from "./MoodClient";
import { getUser } from "@/lib/supabase/auth";

async function getMoodEntries(): Promise<MoodEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mood_entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .limit(30);
  return data ?? [];
}

export default async function MoodPage() {
  const [user, entries] = await Promise.all([getUser(), getMoodEntries()]);
  return <MoodClient initialEntries={entries} userId={user!.id} />;
}

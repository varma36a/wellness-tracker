import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { JournalEvent, MoodEntry, Reflection } from "@/lib/types";

export type DashboardOverviewData = {
  todayMood: MoodEntry | null;
  recentMoods: MoodEntry[];
  todosActive: number;
  todosCompleted: number;
  latestReflection: Pick<Reflection, "title" | "reflection_date"> | null;
  latestEvent: Pick<JournalEvent, "title" | "event_date"> | null;
  eventCount: number;
};

export async function getDashboardOverview(): Promise<DashboardOverviewData> {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [moodsRes, todosRes, reflectionRes, latestEventRes, eventCountRes] = await Promise.all([
    supabase
      .from("mood_entries")
      .select("id,mood_score,emotions,entry_date,created_at")
      .order("entry_date", { ascending: false })
      .limit(7),
    supabase.from("todos").select("completed"),
    supabase
      .from("reflections")
      .select("title,reflection_date")
      .order("reflection_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("journal_events")
      .select("title,event_date")
      .order("event_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("journal_events").select("id", { count: "exact", head: true }),
  ]);

  const recentMoods = (moodsRes.data ?? []) as MoodEntry[];
  const todayMood = recentMoods.find((m) => m.entry_date === today) ?? null;

  const todos = todosRes.data ?? [];
  const todosActive = todos.filter((t) => !t.completed).length;
  const todosCompleted = todos.filter((t) => t.completed).length;

  return {
    todayMood,
    recentMoods,
    todosActive,
    todosCompleted,
    latestReflection: reflectionRes.data,
    latestEvent: latestEventRes.data,
    eventCount: eventCountRes.count ?? 0,
  };
}

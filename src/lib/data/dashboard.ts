import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem, ChecklistLog, JournalEvent, MoodEntry, Reflection } from "@/lib/types";

export type DashboardOverviewData = {
  todayMood: MoodEntry | null;
  recentMoods: MoodEntry[];
  checklistDone: number;
  checklistTotal: number;
  latestReflection: Pick<Reflection, "title" | "reflection_date"> | null;
  latestEvent: Pick<JournalEvent, "title" | "event_date"> | null;
  eventCount: number;
};

export async function getDashboardOverview(): Promise<DashboardOverviewData> {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [moodsRes, itemsRes, logsRes, reflectionRes, latestEventRes, eventCountRes] =
    await Promise.all([
      supabase
        .from("mood_entries")
        .select("id,mood_score,emotions,entry_date,created_at")
        .order("entry_date", { ascending: false })
        .limit(7),
      supabase
        .from("checklist_items")
        .select("id")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("checklist_logs")
        .select("item_id,completed")
        .eq("log_date", today),
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

  const activeItems = (itemsRes.data ?? []) as Pick<ChecklistItem, "id">[];
  const todayLogs = (logsRes.data ?? []) as Pick<ChecklistLog, "item_id" | "completed">[];
  const activeIds = new Set(activeItems.map((i) => i.id));

  return {
    todayMood,
    recentMoods,
    checklistTotal: activeItems.length,
    checklistDone: todayLogs.filter((l) => l.completed && activeIds.has(l.item_id)).length,
    latestReflection: reflectionRes.data,
    latestEvent: latestEventRes.data,
    eventCount: eventCountRes.count ?? 0,
  };
}

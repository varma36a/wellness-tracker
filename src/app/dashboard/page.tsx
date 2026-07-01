"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistItem, ChecklistLog, JournalEvent, MoodEntry, Reflection } from "@/lib/types";
import { ArrowRight, Brain, CheckSquare, Heart, BookOpen, TrendingUp } from "lucide-react";

export default function DashboardOverview() {
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [checklistDone, setChecklistDone] = useState(0);
  const [checklistTotal, setChecklistTotal] = useState(0);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [latestReflection, setLatestReflection] = useState<Reflection | null>(null);
  const [latestEvent, setLatestEvent] = useState<JournalEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const today = format(new Date(), "yyyy-MM-dd");

      const [moodToday, moods, items, logs, reflection, latestEventRes, eventCountRes] =
        await Promise.all([
        supabase
          .from("mood_entries")
          .select("*")
          .eq("entry_date", today)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("mood_entries")
          .select("*")
          .order("entry_date", { ascending: false })
          .limit(7),
        supabase
          .from("checklist_items")
          .select("*")
          .eq("is_active", true)
          .order("sort_order"),
        supabase.from("checklist_logs").select("*").eq("log_date", today),
        supabase
          .from("reflections")
          .select("*")
          .order("reflection_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("journal_events")
          .select("*")
          .order("event_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("journal_events").select("id", { count: "exact", head: true }),
      ]);

      setTodayMood(moodToday.data);
      setRecentMoods(moods.data ?? []);

      const activeItems = (items.data ?? []) as ChecklistItem[];
      const todayLogs = (logs.data ?? []) as ChecklistLog[];
      setChecklistTotal(activeItems.length);
      setChecklistDone(
        todayLogs.filter((l) => l.completed && activeItems.some((i) => i.id === l.item_id)).length
      );

      setLatestReflection(reflection.data);
      setLatestEvent(latestEventRes.data);
      setEventCount(eventCountRes.count ?? 0);
      setLoading(false);
    }

    load();
  }, []);

  const avgMood =
    recentMoods.length > 0
      ? (recentMoods.reduce((s, m) => s + m.mood_score, 0) / recentMoods.length).toFixed(1)
      : "—";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-heading">
          Good {getGreeting()}, welcome back
        </h1>
        <p className="page-subheading">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<Heart className="h-5 w-5 text-rose-500" />}
          label="Today's mood"
          value={todayMood ? `${todayMood.mood_score}/10` : "Not logged"}
          sub={todayMood?.emotions?.slice(0, 2).join(", ") || "Log how you feel"}
        />
        <StatCard
          icon={<CheckSquare className="h-5 w-5 text-sage-600" />}
          label="Checklist today"
          value={`${checklistDone}/${checklistTotal}`}
          sub={
            checklistTotal > 0
              ? `${Math.round((checklistDone / checklistTotal) * 100)}% complete`
              : "Add habits"
          }
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-lavender-600" />}
          label="7-day avg mood"
          value={avgMood}
          sub={`${recentMoods.length} entries this week`}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5 text-amber-600" />}
          label="Latest reflection"
          value={latestReflection ? format(new Date(latestReflection.reflection_date), "MMM d") : "None yet"}
          sub={latestReflection?.title ?? "Start journaling"}
        />
        <StatCard
          icon={<Brain className="h-5 w-5 text-blaze-purple" />}
          label="Journal events"
          value={String(eventCount)}
          sub={latestEvent ? `Latest: ${latestEvent.title}` : "Log triggers & reprogramming"}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold text-sage-900">Quick actions</h2>
          <div className="space-y-3">
            <QuickLink
              href="/dashboard/mood"
              title="Log today's mood"
              description="Track emotions, energy, and behavior patterns"
            />
            <QuickLink
              href="/dashboard/checklist"
              title="Complete daily checklist"
              description="Mark off your wellness habits"
            />
            <QuickLink
              href="/dashboard/reflections"
              title="Write a reflection"
              description="Process your day with guided prompts"
            />
            <QuickLink
              href="/dashboard/events"
              title="Log a journal event"
              description="Capture triggers and rewrite subconscious patterns"
            />
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-sage-900">Mood trend (last 7 days)</h2>
          {recentMoods.length === 0 ? (
            <p className="text-sm text-sage-500">No mood entries yet. Start logging to see patterns.</p>
          ) : (
            <div className="flex h-32 items-end gap-2">
              {[...recentMoods].reverse().map((entry) => (
                <div key={entry.id} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-blaze-orange via-blaze-pink to-blaze-violet transition-all"
                    style={{ height: `${(entry.mood_score / 10) * 100}%`, minHeight: "8px" }}
                    title={`${entry.mood_score}/10`}
                  />
                  <span className="text-[10px] text-sage-500">
                    {format(new Date(entry.entry_date), "EEE")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="card">
      <div className="mb-3 flex items-center gap-2">{icon}</div>
      <p className="text-sm text-sage-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-sage-900">{value}</p>
      <p className="mt-1 text-xs text-sage-500">{sub}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-sage-100 p-4 transition hover:border-sage-300 hover:bg-sage-50"
    >
      <div>
        <p className="font-medium text-sage-900">{title}</p>
        <p className="text-sm text-sage-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-sage-400 transition group-hover:translate-x-1 group-hover:text-sage-600" />
    </Link>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

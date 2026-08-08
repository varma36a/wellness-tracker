"use client";

import Link from "next/link";
import { format } from "date-fns";
import type { DashboardOverviewData } from "@/lib/data/dashboard";
import type { MoodEntry } from "@/lib/types";
import { ArrowRight, Brain, Heart, BookOpen, ListTodo, TrendingUp, Wallet } from "lucide-react";

export function DashboardOverview({ data }: { data: DashboardOverviewData }) {
  const {
    todayMood,
    recentMoods,
    todosActive,
    todosCompleted,
    latestReflection,
    latestEvent,
    eventCount,
    financialGoals,
    latestFinancial,
  } = data;

  const avgMood =
    recentMoods.length > 0
      ? (recentMoods.reduce((s, m) => s + m.mood_score, 0) / recentMoods.length).toFixed(1)
      : "—";

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-heading">Good {getGreeting()}, welcome back</h1>
        <p className="page-subheading">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={<Heart className="h-5 w-5 text-rose-500" />}
          label="Today's mood"
          value={todayMood ? `${todayMood.mood_score}/10` : "Not logged"}
          sub={todayMood?.emotions?.slice(0, 2).join(", ") || "Log how you feel"}
        />
        <StatCard
          icon={<ListTodo className="h-5 w-5 text-sage-600" />}
          label="Todo list"
          value={`${todosActive} active`}
          sub={
            todosActive + todosCompleted > 0
              ? `${todosCompleted} completed`
              : "Add your first task"
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
          value={
            latestReflection
              ? format(new Date(latestReflection.reflection_date), "MMM d")
              : "None yet"
          }
          sub={latestReflection?.title ?? "Start journaling"}
        />
        <StatCard
          icon={<Brain className="h-5 w-5 text-blaze-purple" />}
          label="Journal events"
          value={String(eventCount)}
          sub={latestEvent ? `Latest: ${latestEvent.title}` : "Log triggers & reprogramming"}
        />
        <StatCard
          icon={<Wallet className="h-5 w-5 text-emerald-600" />}
          label="Financial goals"
          value={String(financialGoals)}
          sub={latestFinancial ? `Latest: ${latestFinancial.title}` : "Set goals & plan"}
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
              href="/dashboard/todos"
              title="Manage your todos"
              description="Track tasks, priorities, and due dates"
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
            <QuickLink
              href="/dashboard/financial"
              title="Financial goals & planning"
              description="Set targets, plan steps, and record money thoughts"
            />
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold text-sage-900">Mood trend (last 7 days)</h2>
          {recentMoods.length === 0 ? (
            <p className="text-sm text-sage-500">No mood entries yet. Start logging to see patterns.</p>
          ) : (
            <div className="flex h-32 items-end gap-2">
              {[...recentMoods].reverse().map((entry: MoodEntry) => (
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

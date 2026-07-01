"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfToday,
} from "date-fns";
import type { ChecklistItem, ChecklistLog } from "@/lib/types";

export type DayProgress = {
  date: string;
  dayNum: number;
  label: string;
  percent: number;
  completed: number;
  total: number;
  isFuture: boolean;
};

export type HabitProgress = {
  id: string;
  title: string;
  percent: number;
  completedDays: number;
  trackedDays: number;
};

export function buildMonthlyProgress(
  monthValue: string,
  items: ChecklistItem[],
  monthLogs: ChecklistLog[]
): { days: DayProgress[]; habits: HabitProgress[]; monthAvg: number; bestDay: DayProgress | null } {
  const [year, month] = monthValue.split("-").map(Number);
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(monthStart);
  const today = startOfToday();
  const activeIds = new Set(items.map((i) => i.id));
  const total = items.length;

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const logsByDate = new Map<string, ChecklistLog[]>();
  for (const log of monthLogs) {
    if (!activeIds.has(log.item_id)) continue;
    const existing = logsByDate.get(log.log_date) ?? [];
    existing.push(log);
    logsByDate.set(log.log_date, existing);
  }

  const days: DayProgress[] = daysInMonth.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayLogs = logsByDate.get(dateStr) ?? [];
    const completed = dayLogs.filter((l) => l.completed).length;
    const isFutureDay = isAfter(startOfDay(day), today);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      date: dateStr,
      dayNum: day.getDate(),
      label: format(day, "d"),
      percent: isFutureDay ? 0 : percent,
      completed: isFutureDay ? 0 : completed,
      total,
      isFuture: isFutureDay,
    };
  });

  const pastDays = days.filter((d) => !d.isFuture);
  const monthAvg =
    pastDays.length > 0 && total > 0
      ? Math.round(pastDays.reduce((s, d) => s + d.percent, 0) / pastDays.length)
      : 0;

  const bestDay =
    pastDays.length > 0
      ? pastDays.reduce((best, d) => (d.percent > best.percent ? d : best), pastDays[0])
      : null;

  const trackedDays = pastDays.length;

  const habits: HabitProgress[] = items.map((item) => {
    let completedDays = 0;
    for (const day of pastDays) {
      const dayLogs = logsByDate.get(day.date) ?? [];
      if (dayLogs.some((l) => l.item_id === item.id && l.completed)) {
        completedDays++;
      }
    }
    const percent =
      trackedDays > 0 ? Math.round((completedDays / trackedDays) * 100) : 0;

    return {
      id: item.id,
      title: item.title,
      percent,
      completedDays,
      trackedDays,
    };
  });

  habits.sort((a, b) => b.percent - a.percent);

  return { days, habits, monthAvg, bestDay };
}

type MonthlyChecklistProgressProps = {
  monthValue: string;
  onMonthChange: (value: string) => void;
  days: DayProgress[];
  habits: HabitProgress[];
  monthAvg: number;
  bestDay: DayProgress | null;
};

export function MonthlyChecklistProgress({
  monthValue,
  onMonthChange,
  days,
  habits,
  monthAvg,
  bestDay,
}: MonthlyChecklistProgressProps) {
  const monthLabel = format(parseISO(`${monthValue}-01`), "MMMM yyyy");

  return (
    <div className="card mb-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-sage-900">Monthly progress</h2>
          <p className="text-sm text-sage-500">{monthLabel}</p>
        </div>
        <input
          type="month"
          value={monthValue}
          onChange={(e) => onMonthChange(e.target.value)}
          className="input-field max-w-[180px]"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatPill label="Month average" value={`${monthAvg}%`} />
        <StatPill
          label="Best day"
          value={bestDay && bestDay.percent > 0 ? `${bestDay.percent}%` : "—"}
          sub={bestDay && bestDay.percent > 0 ? format(parseISO(bestDay.date), "MMM d") : undefined}
        />
        <StatPill
          label="Days tracked"
          value={String(days.filter((d) => !d.isFuture).length)}
          sub={`of ${days.length} in month`}
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-sage-700">Daily completion</h3>
        {days.every((d) => d.isFuture || d.percent === 0) && days.filter((d) => !d.isFuture).length === 0 ? (
          <p className="text-sm text-sage-500">No data yet for this month.</p>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max items-end gap-1" style={{ height: "140px" }}>
              {days.map((day) => (
                <div
                  key={day.date}
                  className="group flex w-7 flex-col items-center justify-end gap-1 sm:w-8"
                  title={
                    day.isFuture
                      ? `${day.label} — upcoming`
                      : `${format(parseISO(day.date), "MMM d")}: ${day.completed}/${day.total} (${day.percent}%)`
                  }
                >
                  <span className="hidden text-[10px] font-medium text-sage-600 group-hover:block">
                    {day.isFuture ? "" : `${day.percent}%`}
                  </span>
                  <div className="relative flex h-24 w-full items-end rounded-t-md bg-sage-100">
                    <div
                      className={`w-full rounded-t-md transition-all ${
                        day.isFuture
                          ? "bg-sage-200/50"
                          : "bg-gradient-to-t from-blaze-orange via-blaze-pink to-blaze-cyan"
                      }`}
                      style={{
                        height: day.isFuture ? "4px" : `${Math.max(day.percent, day.percent > 0 ? 8 : 4)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-[10px] ${day.isFuture ? "text-sage-300" : "text-sage-500"}`}
                  >
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {habits.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-sage-700">Per-habit completion</h3>
          <ul className="space-y-3">
            {habits.map((habit) => (
              <li key={habit.id}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-sage-800">{habit.title}</span>
                  <span className="shrink-0 font-medium text-sage-900">
                    {habit.percent}%{" "}
                    <span className="font-normal text-sage-500">
                      ({habit.completedDays}/{habit.trackedDays}d)
                    </span>
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-sage-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blaze-violet via-blaze-pink to-blaze-orange transition-all duration-500"
                    style={{ width: `${habit.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-sage-100 bg-sage-50/80 px-4 py-3">
      <p className="text-xs text-sage-500">{label}</p>
      <p className="text-xl font-bold text-sage-900">{value}</p>
      {sub && <p className="text-xs text-sage-400">{sub}</p>}
    </div>
  );
}

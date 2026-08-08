import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isAfter,
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
    const percent = trackedDays > 0 ? Math.round((completedDays / trackedDays) * 100) : 0;

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

"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { format, endOfMonth, startOfMonth, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistData } from "@/lib/data/checklist";
import type { ChecklistItem, ChecklistLog } from "@/lib/types";
import { buildMonthlyProgress } from "@/lib/checklist-progress";
import { MonthlyChecklistProgress } from "@/components/MonthlyChecklistProgress";
import { Check, Plus, Trash2, X } from "lucide-react";

type ChecklistClientProps = ChecklistData & {
  userId: string;
  initialDate: string;
  initialMonth: string;
};

export function ChecklistClient({
  items: initialItems,
  logs: initialLogs,
  monthLogs: initialMonthLogs,
  userId,
  initialDate,
  initialMonth,
}: ChecklistClientProps) {
  const [items, setItems] = useState(initialItems);
  const [logs, setLogs] = useState(initialLogs);
  const [monthLogs, setMonthLogs] = useState(initialMonthLogs);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [adding, setAdding] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchChecklistData = useCallback(async (date: string, monthValue: string) => {
    const [year, month] = monthValue.split("-").map(Number);
    const start = format(startOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date(year, month - 1)), "yyyy-MM-dd");

    const supabase = createClient();
    const [itemsRes, logsRes, monthLogsRes] = await Promise.all([
      supabase
        .from("checklist_items")
        .select("id,title,sort_order,is_active,user_id,created_at")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("checklist_logs")
        .select("id,item_id,log_date,completed,user_id,created_at")
        .eq("log_date", date),
      supabase
        .from("checklist_logs")
        .select("id,item_id,log_date,completed,user_id,created_at")
        .gte("log_date", start)
        .lte("log_date", end),
    ]);

    setItems(itemsRes.data ?? []);
    setLogs(logsRes.data ?? []);
    setMonthLogs(monthLogsRes.data ?? []);
  }, []);

  useEffect(() => {
    if (selectedDate === initialDate && selectedMonth === initialMonth) return;
    startRefresh(() => {
      void fetchChecklistData(selectedDate, selectedMonth);
    });
  }, [selectedDate, selectedMonth, initialDate, initialMonth, fetchChecklistData]);

  useEffect(() => {
    if (selectedDate.startsWith(selectedMonth)) return;
    setSelectedMonth(format(parseISO(selectedDate), "yyyy-MM"));
  }, [selectedDate, selectedMonth]);

  const monthly = useMemo(
    () => buildMonthlyProgress(selectedMonth, items, monthLogs),
    [selectedMonth, items, monthLogs]
  );

  function isCompleted(itemId: string) {
    return logs.some((l) => l.item_id === itemId && l.completed);
  }

  async function toggleItem(item: ChecklistItem) {
    const existing = logs.find((l) => l.item_id === item.id);
    const newCompleted = !isCompleted(item.id);

    setLogs((prev) => {
      if (existing) {
        return prev.map((l) => (l.id === existing.id ? { ...l, completed: newCompleted } : l));
      }
      return [
        ...prev,
        {
          id: `temp-${item.id}`,
          user_id: userId,
          item_id: item.id,
          log_date: selectedDate,
          completed: newCompleted,
          created_at: new Date().toISOString(),
        },
      ];
    });

    setMonthLogs((prev) => {
      const existingMonthLog = prev.find(
        (l) => l.item_id === item.id && l.log_date === selectedDate
      );
      if (existingMonthLog) {
        return prev.map((l) =>
          l.id === existingMonthLog.id ? { ...l, completed: newCompleted } : l
        );
      }
      if (!newCompleted) return prev;
      return [
        ...prev,
        {
          id: `temp-${item.id}-${selectedDate}`,
          user_id: userId,
          item_id: item.id,
          log_date: selectedDate,
          completed: newCompleted,
          created_at: new Date().toISOString(),
        },
      ];
    });

    const supabase = createClient();

    if (existing) {
      await supabase
        .from("checklist_logs")
        .update({ completed: newCompleted })
        .eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("checklist_logs")
        .insert({
          user_id: userId,
          item_id: item.id,
          log_date: selectedDate,
          completed: newCompleted,
        })
        .select("id,item_id,log_date,completed,user_id,created_at")
        .single();

      if (data) {
        setLogs((prev) =>
          prev.map((l) => (l.id === `temp-${item.id}` ? (data as ChecklistLog) : l))
        );
        setMonthLogs((prev) =>
          prev.map((l) =>
            l.id === `temp-${item.id}-${selectedDate}` ? (data as ChecklistLog) : l
          )
        );
      }
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("checklist_items")
      .insert({
        user_id: userId,
        title: newItemTitle.trim(),
        sort_order: items.length,
      })
      .select("id,title,sort_order,is_active,user_id,created_at")
      .single();

    if (data) {
      setItems((prev) => [...prev, data as ChecklistItem]);
    }

    setNewItemTitle("");
    setAdding(false);
  }

  async function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));

    const supabase = createClient();
    await supabase.from("checklist_items").update({ is_active: false }).eq("id", id);
  }

  const completedCount = items.filter((i) => isCompleted(i.id)).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className={isRefreshing ? "opacity-80 transition-opacity" : ""}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-heading">Daily Checklist</h1>
          <p className="page-subheading">Build consistent wellness habits</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input-field max-w-xs"
        />
      </div>

      <div className="card mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-sage-700">
            {selectedDate === today ? "Today's progress" : format(new Date(selectedDate), "MMM d, yyyy")}
          </span>
          <span className="text-sm font-semibold text-sage-900">
            {completedCount}/{items.length} ({progress}%)
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-sage-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blaze-orange via-blaze-pink to-blaze-cyan transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <MonthlyChecklistProgress
        monthValue={selectedMonth}
        onMonthChange={setSelectedMonth}
        days={monthly.days}
        habits={monthly.habits}
        monthAvg={monthly.monthAvg}
        bestDay={monthly.bestDay}
      />

      <div className="card mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-sage-900">Habits</h2>
          {!adding && (
            <button onClick={() => setAdding(true)} className="btn-secondary text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add habit
            </button>
          )}
        </div>

        {adding && (
          <form onSubmit={addItem} className="mb-4 flex gap-2">
            <input
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              className="input-field flex-1"
              placeholder="e.g. Meditate for 10 minutes"
              autoFocus
            />
            <button type="submit" className="btn-primary">
              Add
            </button>
            <button type="button" onClick={() => setAdding(false)} className="btn-secondary">
              <X className="h-4 w-4" />
            </button>
          </form>
        )}

        {items.length === 0 ? (
          <p className="text-center text-sm text-sage-500">
            No habits yet. Add your first wellness habit above.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => {
              const done = isCompleted(item.id);
              return (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    done ? "border-sage-300 bg-sage-50" : "border-sage-100 bg-white"
                  }`}
                >
                  <button
                    onClick={() => toggleItem(item)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                      done
                        ? "border-sage-600 bg-sage-600 text-white"
                        : "border-sage-300 hover:border-sage-500"
                    }`}
                  >
                    {done && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <span
                    className={`flex-1 text-sm ${done ? "text-sage-500 line-through" : "text-sage-800"}`}
                  >
                    {item.title}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg p-1.5 text-sage-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

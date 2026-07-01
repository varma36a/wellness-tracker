"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistItem, ChecklistLog } from "@/lib/types";
import { Check, Plus, Trash2, X } from "lucide-react";

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [logs, setLogs] = useState<ChecklistLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [adding, setAdding] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  async function loadData(date: string) {
    const supabase = createClient();
    const [itemsRes, logsRes] = await Promise.all([
      supabase.from("checklist_items").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("checklist_logs").select("*").eq("log_date", date),
    ]);
    setItems(itemsRes.data ?? []);
    setLogs(logsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  function isCompleted(itemId: string) {
    return logs.some((l) => l.item_id === itemId && l.completed);
  }

  async function toggleItem(item: ChecklistItem) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const existing = logs.find((l) => l.item_id === item.id);
    const newCompleted = !isCompleted(item.id);

    if (existing) {
      await supabase
        .from("checklist_logs")
        .update({ completed: newCompleted })
        .eq("id", existing.id);
    } else {
      await supabase.from("checklist_logs").insert({
        user_id: user.id,
        item_id: item.id,
        log_date: selectedDate,
        completed: newCompleted,
      });
    }

    await loadData(selectedDate);
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("checklist_items").insert({
      user_id: user.id,
      title: newItemTitle.trim(),
      sort_order: items.length,
    });

    setNewItemTitle("");
    setAdding(false);
    await loadData(selectedDate);
  }

  async function removeItem(id: string) {
    const supabase = createClient();
    await supabase.from("checklist_items").update({ is_active: false }).eq("id", id);
    await loadData(selectedDate);
  }

  const completedCount = items.filter((i) => isCompleted(i.id)).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
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

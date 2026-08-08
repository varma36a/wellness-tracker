"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import {
  FINANCIAL_CATEGORIES,
  FINANCIAL_ENTRY_TYPES,
  FINANCIAL_GOAL_STATUSES,
  FINANCIAL_THOUGHT_PROMPTS,
  type FinancialEntry,
} from "@/lib/types";
import { DollarSign, Edit3, Plus, Target, Trash2, Wallet } from "lucide-react";

type Filter = "all" | "goal" | "plan" | "thought";

export function FinancialClient({
  initialEntries,
  userId,
}: {
  initialEntries: FinancialEntry[];
  userId: string;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [entryType, setEntryType] = useState("goal");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState("active");
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const filtered = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((e) => e.entry_type === filter);
  }, [entries, filter]);

  const summary = useMemo(() => {
    const goals = entries.filter((e) => e.entry_type === "goal");
    const activeGoals = goals.filter((g) => g.status === "active");
    const achievedGoals = goals.filter((g) => g.status === "achieved");
    const totalTarget = activeGoals.reduce((s, g) => s + (g.target_amount ?? 0), 0);
    const totalSaved = activeGoals.reduce((s, g) => s + (g.current_amount ?? 0), 0);
    return {
      activeGoals: activeGoals.length,
      achievedGoals: achievedGoals.length,
      plans: entries.filter((e) => e.entry_type === "plan").length,
      thoughts: entries.filter((e) => e.entry_type === "thought").length,
      totalTarget,
      totalSaved,
    };
  }, [entries]);

  function resetForm() {
    setTitle("");
    setEntryType("goal");
    setTargetAmount("");
    setCurrentAmount("");
    setCategory("");
    setContent("");
    setTargetDate("");
    setStatus("active");
    setEntryDate(format(new Date(), "yyyy-MM-dd"));
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(entry: FinancialEntry) {
    setEditingId(entry.id);
    setTitle(entry.title);
    setEntryType(entry.entry_type);
    setTargetAmount(entry.target_amount != null ? String(entry.target_amount) : "");
    setCurrentAmount(entry.current_amount != null ? String(entry.current_amount) : "");
    setCategory(entry.category ?? "");
    setContent(entry.content ?? "");
    setTargetDate(entry.target_date ?? "");
    setStatus(entry.status);
    setEntryDate(entry.entry_date);
    setShowForm(true);
  }

  function appendPrompt(prompt: string) {
    setContent((prev) => (prev ? `${prev}\n\n${prompt}\n` : `${prompt}\n`));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const payload = {
      title: title.trim(),
      entry_type: entryType,
      target_amount: targetAmount.trim() ? parseFloat(targetAmount) : null,
      current_amount: currentAmount.trim() ? parseFloat(currentAmount) : null,
      category: category.trim() || null,
      content: content.trim() || null,
      target_date: targetDate || null,
      status: entryType === "goal" ? status : "active",
      entry_date: entryDate,
    };

    if (editingId) {
      const { data } = await supabase
        .from("financial_entries")
        .update(payload)
        .eq("id", editingId)
        .select("*")
        .single();
      if (data) {
        setEntries((prev) => prev.map((e) => (e.id === editingId ? (data as FinancialEntry) : e)));
      }
    } else {
      const { data } = await supabase
        .from("financial_entries")
        .insert({ ...payload, user_id: userId })
        .select("*")
        .single();
      if (data) {
        setEntries((prev) => [data as FinancialEntry, ...prev]);
      }
    }

    resetForm();
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    const supabase = createClient();
    await supabase.from("financial_entries").delete().eq("id", id);
  }

  function entryTypeLabel(value: string) {
    return FINANCIAL_ENTRY_TYPES.find((t) => t.value === value)?.label ?? value;
  }

  function formatCurrency(value: number | null) {
    if (value == null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function typeColor(type: string) {
    switch (type) {
      case "goal":
        return "bg-emerald-100 text-emerald-700";
      case "plan":
        return "bg-blue-100 text-blue-700";
      case "thought":
        return "bg-violet-100 text-violet-700";
      default:
        return "bg-sage-100 text-sage-600";
    }
  }

  function goalProgress(entry: FinancialEntry) {
    if (!entry.target_amount || entry.target_amount <= 0) return 0;
    return Math.min(100, Math.round(((entry.current_amount ?? 0) / entry.target_amount) * 100));
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="page-heading">Financial Goals</h1>
          <p className="page-subheading">Set goals, plan your path, and record money thoughts</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
            <Plus className="h-4 w-4" />
            Add entry
          </button>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Target className="h-5 w-5 text-emerald-600" />}
          label="Active goals"
          value={String(summary.activeGoals)}
          sub={`${summary.achievedGoals} achieved`}
        />
        <SummaryCard
          icon={<DollarSign className="h-5 w-5 text-blaze-purple" />}
          label="Saved toward goals"
          value={formatCurrency(summary.totalSaved)}
          sub={`of ${formatCurrency(summary.totalTarget)} target`}
        />
        <SummaryCard
          icon={<Wallet className="h-5 w-5 text-blue-600" />}
          label="Plans"
          value={String(summary.plans)}
          sub="Strategies documented"
        />
        <SummaryCard
          icon={<Edit3 className="h-5 w-5 text-violet-600" />}
          label="Thoughts"
          value={String(summary.thoughts)}
          sub="Money reflections logged"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", "goal", "plan", "thought"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              filter === f
                ? "bg-gradient-to-r from-blaze-orange to-blaze-pink text-white shadow-md"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {f === "all" ? "All" : entryTypeLabel(f)}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blaze-purple" />
            <h2 className="font-semibold text-sage-900">
              {editingId ? "Edit entry" : "New financial entry"}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Emergency fund, debt-free plan, money anxiety…"
                required
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label">Entry type</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {FINANCIAL_ENTRY_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setEntryType(type.value)}
                  className={`rounded-xl border p-3 text-left transition ${
                    entryType === type.value
                      ? "border-blaze-violet bg-gradient-to-r from-blaze-violet/10 to-blaze-pink/10 ring-2 ring-blaze-violet/30"
                      : "border-sage-200 hover:border-sage-300"
                  }`}
                >
                  <p className="text-sm font-medium text-sage-900">{type.label}</p>
                  <p className="mt-0.5 text-xs text-sage-500">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
              >
                <option value="">Select a category</option>
                {FINANCIAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {entryType === "goal" && (
              <div>
                <label className="label">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field"
                >
                  {FINANCIAL_GOAL_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {entryType === "goal" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Target amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="input-field"
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="label">Current amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="input-field"
                  placeholder="2500"
                />
              </div>
              <div>
                <label className="label">Target date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          )}

          <div>
            <label className="label">
              {entryType === "goal"
                ? "Notes (optional)"
                : entryType === "plan"
                  ? "Your plan"
                  : "Your thoughts"}
            </label>
            {entryType === "thought" && (
              <div className="mb-3 flex flex-wrap gap-2">
                {FINANCIAL_THOUGHT_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => appendPrompt(prompt)}
                    className="rounded-lg bg-gradient-to-r from-blaze-violet/20 to-blaze-pink/20 px-3 py-1.5 text-xs font-medium text-blaze-purple transition hover:from-blaze-violet/30 hover:to-blaze-pink/30"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field min-h-[120px] resize-y"
              placeholder={
                entryType === "plan"
                  ? "Outline steps, milestones, and actions to reach your goals…"
                  : entryType === "thought"
                    ? "Write freely about your relationship with money…"
                    : "Why this goal matters, milestones, reminders…"
              }
              required={entryType !== "goal"}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : editingId ? "Update entry" : "Save entry"}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-12 text-center">
            <Wallet className="mb-4 h-12 w-12 text-blaze-violet/40" />
            <p className="text-sage-700">No financial entries yet.</p>
            <p className="mt-1 text-sm text-sage-500">
              Set a goal, write a plan, or capture your money thoughts.
            </p>
          </div>
        ) : (
          filtered.map((entry) => (
            <article key={entry.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-sage-900">{entry.title}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor(entry.entry_type)}`}
                    >
                      {entryTypeLabel(entry.entry_type)}
                    </span>
                    <span className="text-sm text-sage-500">
                      {format(new Date(entry.entry_date), "MMM d, yyyy")}
                    </span>
                    {entry.entry_type === "goal" && entry.status !== "active" && (
                      <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs text-sage-600 capitalize">
                        {entry.status}
                      </span>
                    )}
                  </div>

                  {entry.category && (
                    <span className="inline-block rounded-full bg-sage-100 px-2.5 py-0.5 text-xs text-sage-600">
                      {entry.category}
                    </span>
                  )}

                  {entry.entry_type === "goal" && entry.target_amount != null && (
                    <div>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-sage-600">
                          {formatCurrency(entry.current_amount)} of {formatCurrency(entry.target_amount)}
                        </span>
                        <span className="font-medium text-sage-900">{goalProgress(entry)}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-sage-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                          style={{ width: `${goalProgress(entry)}%` }}
                        />
                      </div>
                      {entry.target_date && (
                        <p className="mt-1 text-xs text-sage-500">
                          Target: {format(new Date(entry.target_date), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  )}

                  {entry.content && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-sage-700">
                      {entry.content}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => startEdit(entry)}
                    className="rounded-lg p-2 text-sage-400 transition hover:bg-sage-100 hover:text-sage-700"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="rounded-lg p-2 text-sage-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function SummaryCard({
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

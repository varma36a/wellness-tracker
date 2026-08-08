"use client";

import { useMemo, useState } from "react";
import { format, isPast, isToday, parseISO, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { TODO_PRIORITIES, type Todo } from "@/lib/types";
import { Check, Edit3, ListTodo, Plus, Trash2 } from "lucide-react";

type Filter = "all" | "active" | "completed";

export function TodoClient({
  initialTodos,
  userId,
}: {
  initialTodos: Todo[];
  userId: string;
}) {
  const [todos, setTodos] = useState(initialTodos);
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const filtered = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  function resetForm() {
    setTitle("");
    setNotes("");
    setPriority("medium");
    setDueDate("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setTitle(todo.title);
    setNotes(todo.notes ?? "");
    setPriority(todo.priority);
    setDueDate(todo.due_date ?? "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const payload = {
      title: title.trim(),
      notes: notes.trim() || null,
      priority,
      due_date: dueDate || null,
    };

    if (editingId) {
      const { data } = await supabase
        .from("todos")
        .update(payload)
        .eq("id", editingId)
        .select("*")
        .single();
      if (data) {
        setTodos((prev) => prev.map((t) => (t.id === editingId ? (data as Todo) : t)));
      }
    } else {
      const { data } = await supabase
        .from("todos")
        .insert({ ...payload, user_id: userId, sort_order: todos.length })
        .select("*")
        .single();
      if (data) {
        setTodos((prev) => [data as Todo, ...prev]);
      }
    }

    resetForm();
    setSaving(false);
  }

  async function toggleComplete(todo: Todo) {
    const newCompleted = !todo.completed;
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, completed: newCompleted } : t))
    );

    const supabase = createClient();
    await supabase.from("todos").update({ completed: newCompleted }).eq("id", todo.id);
  }

  async function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const supabase = createClient();
    await supabase.from("todos").delete().eq("id", id);
  }

  function priorityStyle(p: string) {
    switch (p) {
      case "high":
        return "bg-rose-100 text-rose-700";
      case "low":
        return "bg-sage-100 text-sage-600";
      default:
        return "bg-amber-100 text-amber-700";
    }
  }

  function dueDateLabel(dateStr: string | null, completed: boolean) {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    const label = isToday(date) ? "Today" : format(date, "MMM d, yyyy");
    if (completed) return { label, className: "text-sage-400" };
    if (isPast(startOfDay(date)) && !isToday(date)) {
      return { label: `Overdue · ${label}`, className: "text-rose-600 font-medium" };
    }
    return { label, className: "text-sage-500" };
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="page-heading">Todo List</h1>
          <p className="page-subheading">Track tasks, priorities, and due dates</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
            <Plus className="h-4 w-4" />
            Add todo
          </button>
        )}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatPill label="Active" value={String(activeCount)} />
        <StatPill label="Completed" value={String(completedCount)} />
        <StatPill label="Total" value={String(todos.length)} />
      </div>

      <div className="mb-6 flex gap-2">
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              filter === f
                ? "bg-gradient-to-r from-blaze-orange to-blaze-pink text-white shadow-md"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-5">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-blaze-purple" />
            <h2 className="font-semibold text-sage-900">
              {editingId ? "Edit todo" : "New todo"}
            </h2>
          </div>

          <div>
            <label className="label">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="What needs to get done?"
              required
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input-field"
              >
                {TODO_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due date (optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[80px] resize-y"
              placeholder="Additional details…"
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : editingId ? "Update todo" : "Add todo"}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-12 text-center">
            <ListTodo className="mb-4 h-12 w-12 text-blaze-violet/40" />
            <p className="text-sage-700">
              {filter === "all" ? "No todos yet." : `No ${filter} todos.`}
            </p>
            <p className="mt-1 text-sm text-sage-500">
              Add your first task to start tracking what matters.
            </p>
          </div>
        ) : (
          filtered.map((todo) => {
            const due = dueDateLabel(todo.due_date, todo.completed);
            return (
              <article
                key={todo.id}
                className={`card flex items-start gap-3 transition ${
                  todo.completed ? "opacity-75" : ""
                }`}
              >
                <button
                  onClick={() => toggleComplete(todo)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                    todo.completed
                      ? "border-sage-600 bg-sage-600 text-white"
                      : "border-sage-300 hover:border-sage-500"
                  }`}
                >
                  {todo.completed && <Check className="h-3.5 w-3.5" />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`font-medium text-sage-900 ${
                        todo.completed ? "line-through text-sage-500" : ""
                      }`}
                    >
                      {todo.title}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyle(todo.priority)}`}
                    >
                      {TODO_PRIORITIES.find((p) => p.value === todo.priority)?.label ??
                        todo.priority}
                    </span>
                  </div>

                  {todo.notes && (
                    <p className="mt-1 text-sm text-sage-600">{todo.notes}</p>
                  )}

                  {due && <p className={`mt-1 text-xs ${due.className}`}>{due.label}</p>}
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => startEdit(todo)}
                    className="rounded-lg p-2 text-sage-400 transition hover:bg-sage-100 hover:text-sage-700"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="rounded-lg p-2 text-sage-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="card py-4 text-center">
      <p className="text-sm text-sage-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-sage-900">{value}</p>
    </div>
  );
}

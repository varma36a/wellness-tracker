"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { REFLECTION_PROMPTS, type Reflection } from "@/lib/types";
import { BookOpen, Plus, Trash2, Edit3 } from "lucide-react";

export default function ReflectionsPage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [moodAtWriting, setMoodAtWriting] = useState(5);
  const [tags, setTags] = useState("");
  const [reflectionDate, setReflectionDate] = useState(format(new Date(), "yyyy-MM-dd"));

  async function loadReflections() {
    const supabase = createClient();
    const { data } = await supabase
      .from("reflections")
      .select("*")
      .order("reflection_date", { ascending: false })
      .limit(50);
    setReflections(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadReflections();
  }, []);

  function resetForm() {
    setTitle("");
    setContent("");
    setMoodAtWriting(5);
    setTags("");
    setReflectionDate(format(new Date(), "yyyy-MM-dd"));
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(reflection: Reflection) {
    setEditingId(reflection.id);
    setTitle(reflection.title);
    setContent(reflection.content);
    setMoodAtWriting(reflection.mood_at_writing ?? 5);
    setTags(reflection.tags?.join(", ") ?? "");
    setReflectionDate(reflection.reflection_date);
    setShowForm(true);
  }

  function insertPrompt(prompt: string) {
    setContent((prev) => (prev ? `${prev}\n\n${prompt}\n` : `${prompt}\n`));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      title: title.trim() || "Untitled",
      content: content.trim(),
      mood_at_writing: moodAtWriting,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      reflection_date: reflectionDate,
    };

    if (editingId) {
      await supabase.from("reflections").update(payload).eq("id", editingId);
    } else {
      await supabase.from("reflections").insert({ ...payload, user_id: user.id });
    }

    resetForm();
    await loadReflections();
    setSaving(false);
  }

  async function deleteReflection(id: string) {
    const supabase = createClient();
    await supabase.from("reflections").delete().eq("id", id);
    await loadReflections();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="page-heading">Self-Reflections</h1>
          <p className="page-subheading">Journal your thoughts and discover patterns</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            New reflection
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-5">
          <h2 className="font-semibold text-sage-900">
            {editingId ? "Edit reflection" : "Write a reflection"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Morning thoughts, weekly review…"
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                value={reflectionDate}
                onChange={(e) => setReflectionDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label">Mood while writing: {moodAtWriting}/10</label>
            <input
              type="range"
              min={1}
              max={10}
              value={moodAtWriting}
              onChange={(e) => setMoodAtWriting(Number(e.target.value))}
              className="w-full accent-lavender-500"
            />
          </div>

          <div>
            <label className="label">Prompts (click to insert)</label>
            <div className="flex flex-wrap gap-2">
              {REFLECTION_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => insertPrompt(prompt)}
                  className="rounded-lg bg-gradient-to-r from-blaze-violet/20 to-blaze-pink/20 px-3 py-1.5 text-xs font-medium text-blaze-purple transition hover:from-blaze-violet/30 hover:to-blaze-pink/30"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Your reflection</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field min-h-[200px] resize-y"
              placeholder="Write freely about your day, feelings, or insights…"
              required
            />
          </div>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-field"
              placeholder="gratitude, work, relationships"
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : editingId ? "Update" : "Save reflection"}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {reflections.length === 0 ? (
          <div className="card flex flex-col items-center py-12 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-sage-300" />
            <p className="text-sage-600">No reflections yet.</p>
            <p className="mt-1 text-sm text-sage-500">
              Start journaling to build self-awareness over time.
            </p>
          </div>
        ) : (
          reflections.map((reflection) => (
            <article key={reflection.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-sage-900">{reflection.title}</h3>
                    <span className="text-sm text-sage-500">
                      {format(new Date(reflection.reflection_date), "MMM d, yyyy")}
                    </span>
                    {reflection.mood_at_writing && (
                      <span className="rounded-full bg-lavender-100 px-2 py-0.5 text-xs text-lavender-700">
                        Mood {reflection.mood_at_writing}/10
                      </span>
                    )}
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-sage-700">
                    {reflection.content}
                  </p>

                  {reflection.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {reflection.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs text-sage-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(reflection)}
                    className="rounded-lg p-2 text-sage-400 transition hover:bg-sage-100 hover:text-sage-700"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteReflection(reflection.id)}
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

"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import {
  EVENT_TYPES,
  SUBCONSCIOUS_PROMPTS,
  type JournalEvent,
} from "@/lib/types";
import { Brain, Plus, Trash2, Edit3, Zap } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<JournalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [emotionalResponse, setEmotionalResponse] = useState("");
  const [oldProgramming, setOldProgramming] = useState("");
  const [newProgramming, setNewProgramming] = useState("");
  const [practiceNote, setPracticeNote] = useState("");
  const [triggerIntensity, setTriggerIntensity] = useState(5);
  const [eventType, setEventType] = useState("trigger");
  const [tags, setTags] = useState("");
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));

  async function loadEvents() {
    const supabase = createClient();
    const { data } = await supabase
      .from("journal_events")
      .select("*")
      .order("event_date", { ascending: false })
      .limit(50);
    setEvents(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function resetForm() {
    setTitle("");
    setEventDescription("");
    setEmotionalResponse("");
    setOldProgramming("");
    setNewProgramming("");
    setPracticeNote("");
    setTriggerIntensity(5);
    setEventType("trigger");
    setTags("");
    setEventDate(format(new Date(), "yyyy-MM-dd"));
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(event: JournalEvent) {
    setEditingId(event.id);
    setTitle(event.title);
    setEventDescription(event.event_description);
    setEmotionalResponse(event.emotional_response ?? "");
    setOldProgramming(event.old_programming ?? "");
    setNewProgramming(event.new_programming ?? "");
    setPracticeNote(event.practice_note ?? "");
    setTriggerIntensity(event.trigger_intensity ?? 5);
    setEventType(event.event_type);
    setTags(event.tags?.join(", ") ?? "");
    setEventDate(event.event_date);
    setShowForm(true);
  }

  function appendToField(
    setter: React.Dispatch<React.SetStateAction<string>>,
    prompt: string
  ) {
    setter((prev) => (prev ? `${prev}\n\n${prompt}\n` : `${prompt}\n`));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventDescription.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      title: title.trim() || "Untitled event",
      event_description: eventDescription.trim(),
      emotional_response: emotionalResponse.trim() || null,
      old_programming: oldProgramming.trim() || null,
      new_programming: newProgramming.trim() || null,
      practice_note: practiceNote.trim() || null,
      trigger_intensity: triggerIntensity,
      event_type: eventType,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      event_date: eventDate,
    };

    if (editingId) {
      await supabase.from("journal_events").update(payload).eq("id", editingId);
    } else {
      await supabase.from("journal_events").insert({ ...payload, user_id: user.id });
    }

    resetForm();
    await loadEvents();
    setSaving(false);
  }

  async function deleteEvent(id: string) {
    const supabase = createClient();
    await supabase.from("journal_events").delete().eq("id", id);
    await loadEvents();
  }

  function eventTypeLabel(value: string) {
    return EVENT_TYPES.find((t) => t.value === value)?.label ?? value;
  }

  function intensityColor(intensity: number | null) {
    if (!intensity) return "bg-sage-100 text-sage-600";
    if (intensity <= 3) return "bg-emerald-100 text-emerald-700";
    if (intensity <= 6) return "bg-amber-100 text-amber-700";
    return "bg-rose-100 text-rose-700";
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
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="page-heading">Journal Events</h1>
          <p className="page-subheading">
            Capture life events and reprogram subconscious patterns
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary shrink-0">
            <Plus className="h-4 w-4" />
            Log event
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-6">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blaze-purple" />
            <h2 className="font-semibold text-sage-900">
              {editingId ? "Edit journal event" : "New journal event"}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Conflict at work, morning anxiety…"
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="label">Event type</label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setEventType(type.value)}
                  className={`rounded-xl border p-3 text-left transition ${
                    eventType === type.value
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

          <div>
            <label className="label">
              Trigger intensity: {triggerIntensity}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={triggerIntensity}
              onChange={(e) => setTriggerIntensity(Number(e.target.value))}
              className="w-full accent-blaze-pink"
            />
            <div className="mt-1 flex justify-between text-xs text-sage-400">
              <span>1 — Mild</span>
              <span>10 — Overwhelming</span>
            </div>
          </div>

          <Section
            title="What happened"
            subtitle="Describe the event as it unfolded"
            prompts={SUBCONSCIOUS_PROMPTS.event}
            onPrompt={(p) => appendToField(setEventDescription, p)}
          >
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              className="input-field min-h-[100px] resize-y"
              placeholder="Describe the situation, people, and context…"
              required
            />
          </Section>

          <Section
            title="Emotional response"
            subtitle="How did your body and mind react?"
            prompts={[]}
            onPrompt={() => {}}
          >
            <textarea
              value={emotionalResponse}
              onChange={(e) => setEmotionalResponse(e.target.value)}
              className="input-field min-h-[80px] resize-y"
              placeholder="Feelings, sensations, urges, reactions…"
            />
          </Section>

          <Section
            title="Old programming"
            subtitle="Subconscious pattern, automatic thought, or limiting belief"
            prompts={SUBCONSCIOUS_PROMPTS.old}
            onPrompt={(p) => appendToField(setOldProgramming, p)}
            accent="from-rose-50 to-amber-50 border-rose-200"
          >
            <textarea
              value={oldProgramming}
              onChange={(e) => setOldProgramming(e.target.value)}
              className="input-field min-h-[90px] resize-y"
              placeholder="I'm not enough… They will reject me… I always mess up…"
            />
          </Section>

          <Section
            title="New programming"
            subtitle="Conscious reframe — the belief you choose instead"
            prompts={SUBCONSCIOUS_PROMPTS.new}
            onPrompt={(p) => appendToField(setNewProgramming, p)}
            accent="from-emerald-50 to-cyan-50 border-emerald-200"
          >
            <textarea
              value={newProgramming}
              onChange={(e) => setNewProgramming(e.target.value)}
              className="input-field min-h-[90px] resize-y"
              placeholder="I am capable… Their reaction is not about my worth…"
            />
          </Section>

          <Section
            title="Practice & reinforcement"
            subtitle="Affirmation, ritual, or action to install the new pattern"
            prompts={SUBCONSCIOUS_PROMPTS.practice}
            onPrompt={(p) => appendToField(setPracticeNote, p)}
            accent="from-violet-50 to-purple-50 border-violet-200"
          >
            <textarea
              value={practiceNote}
              onChange={(e) => setPracticeNote(e.target.value)}
              className="input-field min-h-[80px] resize-y"
              placeholder="Daily affirmation, breathwork, journal prompt to repeat…"
            />
          </Section>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-field"
              placeholder="work, anxiety, self-worth, family"
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : editingId ? "Update event" : "Save event"}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="card flex flex-col items-center py-12 text-center">
            <Zap className="mb-4 h-12 w-12 text-blaze-violet/40" />
            <p className="text-sage-700">No journal events yet.</p>
            <p className="mt-1 text-sm text-sage-500">
              Log moments that trigger old patterns — then rewrite the script.
            </p>
          </div>
        ) : (
          events.map((event) => (
            <article key={event.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-sage-900">{event.title}</h3>
                    <span className="rounded-full bg-gradient-to-r from-blaze-violet/20 to-blaze-pink/20 px-2.5 py-0.5 text-xs font-medium text-blaze-purple">
                      {eventTypeLabel(event.event_type)}
                    </span>
                    <span className="text-sm text-sage-500">
                      {format(new Date(event.event_date), "MMM d, yyyy")}
                    </span>
                    {event.trigger_intensity && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${intensityColor(event.trigger_intensity)}`}
                      >
                        Intensity {event.trigger_intensity}/10
                      </span>
                    )}
                  </div>

                  <EventBlock label="What happened" content={event.event_description} />
                  {event.emotional_response && (
                    <EventBlock label="Emotional response" content={event.emotional_response} />
                  )}
                  {event.old_programming && (
                    <EventBlock
                      label="Old programming"
                      content={event.old_programming}
                      variant="old"
                    />
                  )}
                  {event.new_programming && (
                    <EventBlock
                      label="New programming"
                      content={event.new_programming}
                      variant="new"
                    />
                  )}
                  {event.practice_note && (
                    <EventBlock
                      label="Practice"
                      content={event.practice_note}
                      variant="practice"
                    />
                  )}

                  {event.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {event.tags.map((tag) => (
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
                    onClick={() => startEdit(event)}
                    className="rounded-lg p-2 text-sage-400 transition hover:bg-sage-100 hover:text-sage-700"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id)}
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

function Section({
  title,
  subtitle,
  prompts,
  onPrompt,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  prompts: string[];
  onPrompt: (prompt: string) => void;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-4 ${accent ?? "border-sage-100 bg-sage-50/50"}`}>
      <p className="font-medium text-sage-900">{title}</p>
      <p className="mb-3 text-xs text-sage-500">{subtitle}</p>
      {prompts.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onPrompt(prompt)}
              className="rounded-lg bg-white/80 px-2.5 py-1 text-xs text-blaze-purple shadow-sm transition hover:bg-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

function EventBlock({
  label,
  content,
  variant = "default",
}: {
  label: string;
  content: string;
  variant?: "default" | "old" | "new" | "practice";
}) {
  const styles = {
    default: "border-sage-100 bg-white",
    old: "border-rose-100 bg-rose-50/50",
    new: "border-emerald-100 bg-emerald-50/50",
    practice: "border-violet-100 bg-violet-50/50",
  };

  return (
    <div className={`rounded-lg border p-3 ${styles[variant]}`}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-sage-500">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-sage-800">{content}</p>
    </div>
  );
}

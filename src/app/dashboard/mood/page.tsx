"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { EMOTION_OPTIONS, type MoodEntry } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

export default function MoodPage() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [moodScore, setMoodScore] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [behaviorNotes, setBehaviorNotes] = useState("");
  const [triggers, setTriggers] = useState("");
  const [energyLevel, setEnergyLevel] = useState(3);
  const [sleepHours, setSleepHours] = useState("");
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));

  async function loadEntries() {
    const supabase = createClient();
    const { data } = await supabase
      .from("mood_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .limit(30);
    setEntries(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadEntries();
  }, []);

  function toggleEmotion(emotion: string) {
    setSelectedEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("mood_entries").insert({
      user_id: user.id,
      mood_score: moodScore,
      emotions: selectedEmotions,
      behavior_notes: behaviorNotes || null,
      triggers: triggers || null,
      energy_level: energyLevel,
      sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
      entry_date: entryDate,
    });

    if (!error) {
      setShowForm(false);
      setMoodScore(5);
      setSelectedEmotions([]);
      setBehaviorNotes("");
      setTriggers("");
      setEnergyLevel(3);
      setSleepHours("");
      setEntryDate(format(new Date(), "yyyy-MM-dd"));
      await loadEntries();
    }

    setSaving(false);
  }

  async function deleteEntry(id: string) {
    const supabase = createClient();
    await supabase.from("mood_entries").delete().eq("id", id);
    await loadEntries();
  }

  const moodLabel = (score: number) => {
    if (score <= 3) return "Low";
    if (score <= 5) return "Neutral";
    if (score <= 7) return "Good";
    return "Great";
  };

  const moodColor = (score: number) => {
    if (score <= 3) return "text-rose-600 bg-rose-50";
    if (score <= 5) return "text-amber-600 bg-amber-50";
    if (score <= 7) return "text-sage-600 bg-sage-50";
    return "text-lavender-600 bg-lavender-50";
  };

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
          <h1 className="page-heading">Mood & Behavior</h1>
          <p className="page-subheading">Track emotions, energy, and patterns over time</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Log entry
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-8 space-y-6">
          <h2 className="font-semibold text-sage-900">New mood entry</h2>

          <div>
            <label className="label">Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="input-field max-w-xs"
            />
          </div>

          <div>
            <label className="label">
              Mood score: {moodScore}/10 — {moodLabel(moodScore)}
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={moodScore}
              onChange={(e) => setMoodScore(Number(e.target.value))}
              className="w-full accent-sage-600"
            />
            <div className="mt-1 flex justify-between text-xs text-sage-400">
              <span>1 — Very low</span>
              <span>10 — Excellent</span>
            </div>
          </div>

          <div>
            <label className="label">Emotions (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {EMOTION_OPTIONS.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => toggleEmotion(emotion)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    selectedEmotions.includes(emotion)
                      ? "bg-gradient-to-r from-blaze-pink to-blaze-purple text-white"
                      : "bg-sage-100 text-sage-700 hover:bg-sage-200"
                  }`}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Energy level: {energyLevel}/5</label>
              <input
                type="range"
                min={1}
                max={5}
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
                className="w-full accent-sage-600"
              />
            </div>
            <div>
              <label className="label">Sleep (hours)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                className="input-field"
                placeholder="e.g. 7.5"
              />
            </div>
          </div>

          <div>
            <label className="label">Behavior notes</label>
            <textarea
              value={behaviorNotes}
              onChange={(e) => setBehaviorNotes(e.target.value)}
              className="input-field min-h-[80px] resize-y"
              placeholder="What did you do today? Any notable behaviors?"
            />
          </div>

          <div>
            <label className="label">Triggers or context</label>
            <textarea
              value={triggers}
              onChange={(e) => setTriggers(e.target.value)}
              className="input-field min-h-[60px] resize-y"
              placeholder="What influenced your mood? Events, people, situations..."
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save entry"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        <h2 className="font-semibold text-sage-900">Recent entries</h2>
        {entries.length === 0 ? (
          <div className="card text-center text-sage-500">
            No entries yet. Log your first mood to start spotting patterns.
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${moodColor(entry.mood_score)}`}
                    >
                      {entry.mood_score}/10
                    </span>
                    <span className="text-sm text-sage-500">
                      {format(new Date(entry.entry_date), "EEEE, MMM d, yyyy")}
                    </span>
                    {entry.energy_level && (
                      <span className="text-xs text-sage-400">Energy {entry.energy_level}/5</span>
                    )}
                    {entry.sleep_hours && (
                      <span className="text-xs text-sage-400">{entry.sleep_hours}h sleep</span>
                    )}
                  </div>

                  {entry.emotions?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {entry.emotions.map((e) => (
                        <span
                          key={e}
                          className="rounded-full bg-lavender-100 px-2.5 py-0.5 text-xs text-lavender-700"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  )}

                  {entry.behavior_notes && (
                    <p className="mt-3 text-sm text-sage-700">
                      <span className="font-medium">Behavior: </span>
                      {entry.behavior_notes}
                    </p>
                  )}

                  {entry.triggers && (
                    <p className="mt-2 text-sm text-sage-600">
                      <span className="font-medium">Context: </span>
                      {entry.triggers}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="rounded-lg p-2 text-sage-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Delete entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

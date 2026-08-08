-- Wellness Tracker — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor after creating your project.

-- Mood & behavior entries
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  emotions TEXT[] DEFAULT '{}',
  behavior_notes TEXT,
  triggers TEXT,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  sleep_hours NUMERIC(4,1),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Todo list items
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Self-reflection journal entries
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL,
  mood_at_writing INTEGER CHECK (mood_at_writing BETWEEN 1 AND 10),
  tags TEXT[] DEFAULT '{}',
  reflection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date ON mood_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_todos_user_completed ON todos(user_id, completed, sort_order);
CREATE INDEX IF NOT EXISTS idx_todos_user_due ON todos(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_reflections_user_date ON reflections(user_id, reflection_date DESC);

-- Row Level Security
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own mood entries"
  ON mood_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own todos"
  ON todos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own reflections"
  ON reflections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update reflections.updated_at
CREATE OR REPLACE FUNCTION update_reflection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reflections_updated_at
  BEFORE UPDATE ON reflections
  FOR EACH ROW
  EXECUTE FUNCTION update_reflection_timestamp();

CREATE OR REPLACE FUNCTION update_todo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_todo_timestamp();

-- Journal events: life events + subconscious programming work
CREATE TABLE IF NOT EXISTS journal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled event',
  event_description TEXT NOT NULL,
  emotional_response TEXT,
  old_programming TEXT,
  new_programming TEXT,
  practice_note TEXT,
  trigger_intensity INTEGER CHECK (trigger_intensity BETWEEN 1 AND 10),
  event_type TEXT NOT NULL DEFAULT 'trigger',
  tags TEXT[] DEFAULT '{}',
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_events_user_date ON journal_events(user_id, event_date DESC);

ALTER TABLE journal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journal events"
  ON journal_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_journal_event_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_events_updated_at
  BEFORE UPDATE ON journal_events
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_event_timestamp();

-- Optional app PIN (hashed)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash TEXT,
  pin_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_timestamp();

-- Run this in Supabase SQL Editor if you already created the project before journal events existed.

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

DROP TRIGGER IF EXISTS journal_events_updated_at ON journal_events;
CREATE TRIGGER journal_events_updated_at
  BEFORE UPDATE ON journal_events
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_event_timestamp();

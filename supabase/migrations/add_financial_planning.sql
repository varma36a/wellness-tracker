-- Run this in Supabase SQL Editor to add financial goals and planning.

CREATE TABLE IF NOT EXISTS financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'goal',
  target_amount NUMERIC(12,2),
  current_amount NUMERIC(12,2),
  category TEXT,
  content TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_entries_user_type
  ON financial_entries(user_id, entry_type, entry_date DESC);

ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own financial entries"
  ON financial_entries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_financial_entry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS financial_entries_updated_at ON financial_entries;
CREATE TRIGGER financial_entries_updated_at
  BEFORE UPDATE ON financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_entry_timestamp();

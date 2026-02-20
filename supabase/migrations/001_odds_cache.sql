-- PitchPulse: Odds Cache Table
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS odds_cache (
  id BIGSERIAL PRIMARY KEY,
  fixture_id BIGINT NOT NULL,
  bookmaker_id INT NOT NULL,
  bookmaker_name TEXT NOT NULL,
  market_id INT NOT NULL,
  market_name TEXT NOT NULL,
  label TEXT NOT NULL,
  odds_value DECIMAL(8,3) NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fixture_id, bookmaker_id, market_id, label)
);

CREATE INDEX IF NOT EXISTS idx_odds_fixture ON odds_cache(fixture_id);
CREATE INDEX IF NOT EXISTS idx_odds_bookmaker ON odds_cache(fixture_id, bookmaker_id);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE odds_cache ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write (app-level security via API key)
CREATE POLICY "Allow anonymous read" ON odds_cache FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON odds_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON odds_cache FOR UPDATE USING (true);

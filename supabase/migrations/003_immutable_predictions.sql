-- PitchPulse: Immutable Predictions Table (Master Engine v2)
-- Stores SHA256-locked predictions that cannot be modified after publication.
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS immutable_predictions (
  fixture_id BIGINT PRIMARY KEY,
  lambda_home DECIMAL(6,4) NOT NULL,
  lambda_away DECIMAL(6,4) NOT NULL,
  market TEXT NOT NULL,
  market_id TEXT NOT NULL,
  p_model DECIMAL(6,4) NOT NULL,
  odds DECIMAL(6,3) NOT NULL,
  ev_adjusted DECIMAL(6,4) NOT NULL,
  confidence INT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  league_name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'elite',    -- 'elite' or 'safe'
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result TEXT,                           -- NULL until FT ('WIN', 'LOSS', 'VOID')
  profit_loss DECIMAL(8,4),             -- NULL until settled
  checksum TEXT NOT NULL,               -- SHA256 of all prediction fields
  is_frozen BOOLEAN DEFAULT false,      -- true once result is recorded
  bet365_odds DECIMAL(6,3),
  best_bookmaker TEXT,
  edge DECIMAL(6,4)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_immutable_published ON immutable_predictions(published_at);
CREATE INDEX IF NOT EXISTS idx_immutable_tier ON immutable_predictions(tier);
CREATE INDEX IF NOT EXISTS idx_immutable_frozen ON immutable_predictions(is_frozen);

-- Enable Row Level Security
ALTER TABLE immutable_predictions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write (app-level security via API key)
CREATE POLICY "Allow anonymous read" ON immutable_predictions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON immutable_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON immutable_predictions FOR UPDATE USING (true);

-- PitchPulse: Predictions Cache Table
-- Stores generated predictions to ensure they don't change in history

CREATE TABLE IF NOT EXISTS predictions_cache (
  fixture_id BIGINT PRIMARY KEY,
  outcome TEXT NOT NULL,
  confidence INT NOT NULL,
  candidates JSONB,
  summary JSONB,
  signals JSONB,
  markets JSONB,
  main_prediction JSONB,
  is_prime BOOLEAN DEFAULT false,
  is_elite BOOLEAN DEFAULT false,
  star_rating INT,
  kelly_stake DECIMAL(5,2),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE predictions_cache ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write
CREATE POLICY "Allow anonymous read" ON predictions_cache FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON predictions_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON predictions_cache FOR UPDATE USING (true);

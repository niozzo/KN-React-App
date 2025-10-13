-- Migration: Add cache_update_triggers table for version-based cache updates
-- Story: 8.8 - Hybrid Cache Update System
-- Date: 2025-10-13

-- Create the cache update triggers table
CREATE TABLE IF NOT EXISTS cache_update_triggers (
  id SERIAL PRIMARY KEY,
  version INTEGER NOT NULL UNIQUE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast version lookups (DESC for latest first)
CREATE INDEX IF NOT EXISTS idx_cache_triggers_version 
ON cache_update_triggers (version DESC);

-- Insert initial version
INSERT INTO cache_update_triggers (version, triggered_at) 
VALUES (1, NOW())
ON CONFLICT (version) DO NOTHING;

-- Verify table was created
SELECT 'Cache update triggers table created successfully' AS status,
       COUNT(*) AS initial_version_count
FROM cache_update_triggers;


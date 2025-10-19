-- Create table_assignments_cache table in Application DB
-- This table stores computed table assignments for dining events
-- READ-ONLY access to main DB, WRITE-ONLY to Application DB

-- Drop table if exists (for development)
DROP TABLE IF EXISTS table_assignments_cache;

-- Create the table
CREATE TABLE table_assignments_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dining_option_id UUID NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  attendees JSONB NOT NULL, -- Array of all attendees at this table
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one cache entry per table per dining event
  UNIQUE(dining_option_id, table_name)
);

-- Performance indexes
CREATE INDEX idx_table_assignments_dining ON table_assignments_cache(dining_option_id);
CREATE INDEX idx_table_assignments_table ON table_assignments_cache(table_name);
CREATE INDEX idx_table_assignments_cached_at ON table_assignments_cache(cached_at);

-- Add comments for documentation
COMMENT ON TABLE table_assignments_cache IS 'Cache table for dining event table assignments - stores computed table companion data';
COMMENT ON COLUMN table_assignments_cache.dining_option_id IS 'Reference to dining option (dining event)';
COMMENT ON COLUMN table_assignments_cache.table_name IS 'Table name (e.g., Table 1, Table 2)';
COMMENT ON COLUMN table_assignments_cache.attendees IS 'JSONB array of all attendees at this table with their details';
COMMENT ON COLUMN table_assignments_cache.cached_at IS 'When this cache entry was last updated';

-- Verify table creation
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'table_assignments_cache'
ORDER BY ordinal_position;

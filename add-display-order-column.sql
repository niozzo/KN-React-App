-- Add display_order column to speaker_assignments table
-- Run this in your Supabase SQL Editor

-- 1. Add the display_order column
ALTER TABLE speaker_assignments 
ADD COLUMN display_order INTEGER NOT NULL DEFAULT 1;

-- 2. Update existing records to have proper display_order
-- This will set display_order to 1 for all existing speakers
UPDATE speaker_assignments 
SET display_order = 1 
WHERE display_order IS NULL;

-- 3. Create an index for better performance on ordering queries
CREATE INDEX idx_speaker_assignments_display_order 
ON speaker_assignments(agenda_item_id, display_order);

-- 4. Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'speaker_assignments' 
AND column_name = 'display_order';

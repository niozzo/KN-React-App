-- Story 6.1: Profile Visibility & Logout
-- Migration script to add attendee_preferences table to APPLICATION DATABASE
-- Run this SQL on the application database (not main database)

-- Create attendee_preferences table in APPLICATION DATABASE
-- Note: No FK constraint because attendees table is in different database (main DB)
CREATE TABLE IF NOT EXISTS attendee_preferences (
  id UUID PRIMARY KEY,
  profile_visible BOOLEAN DEFAULT true,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments explaining the cross-database relationship
COMMENT ON TABLE attendee_preferences IS 'Stores user privacy preferences. id matches attendee.id from main database.';
COMMENT ON COLUMN attendee_preferences.id IS 'Attendee UUID from main database (no FK constraint across databases)';

-- Enable RLS
ALTER TABLE attendee_preferences ENABLE ROW LEVEL SECURITY;

-- Allow anon read access (app uses anon key)
CREATE POLICY "Enable read access for all users" ON attendee_preferences
  FOR SELECT USING (
    (auth.role() = 'authenticated'::text) OR 
    (auth.role() = 'anon'::text) OR 
    (auth.role() IS NULL)
  );

-- Allow service role to write (for updates)
CREATE POLICY "Enable write access for service role" ON attendee_preferences
  FOR ALL USING (auth.role() = 'service_role'::text);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_attendee_preferences_profile_visible 
  ON attendee_preferences(profile_visible);


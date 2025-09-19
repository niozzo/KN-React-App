-- RLS Policies for Application Database
-- Run these in your Supabase SQL Editor

-- 1. Enable RLS on all tables (if not already enabled)
ALTER TABLE speaker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_item_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendee_metadata ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for speaker_assignments
-- Allow service role full access
CREATE POLICY "Service role full access on speaker_assignments" ON speaker_assignments
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Allow anonymous read access (for future user features)
CREATE POLICY "Allow anonymous read on speaker_assignments" ON speaker_assignments
FOR SELECT USING (true);

-- 3. Create policies for agenda_item_metadata
-- Allow service role full access
CREATE POLICY "Service role full access on agenda_item_metadata" ON agenda_item_metadata
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Allow anonymous read access
CREATE POLICY "Allow anonymous read on agenda_item_metadata" ON agenda_item_metadata
FOR SELECT USING (true);

-- 4. Create policies for attendee_metadata
-- Allow service role full access
CREATE POLICY "Service role full access on attendee_metadata" ON attendee_metadata
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Allow anonymous read access
CREATE POLICY "Allow anonymous read on attendee_metadata" ON attendee_metadata
FOR SELECT USING (true);

-- 5. Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('speaker_assignments', 'agenda_item_metadata', 'attendee_metadata')
ORDER BY tablename, policyname;

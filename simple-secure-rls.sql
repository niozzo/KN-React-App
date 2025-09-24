-- Apply a simpler secure RLS policy
DROP POLICY IF EXISTS "Users can view dining metadata" ON dining_item_metadata;

-- Simple secure policy: Allow anon and authenticated access
CREATE POLICY "Users can view dining metadata" ON dining_item_metadata
FOR SELECT USING (
    -- Allow anon access (for public app access)
    (auth.role() = 'anon'::text) OR 
    -- Allow authenticated access
    (auth.role() = 'authenticated'::text) OR
    -- Allow if no role is set (fallback for anon)
    (auth.role() IS NULL)
);

-- Test the simple secure policy
SET ROLE anon;
SELECT 'anon role test with simple secure policy' as test, COUNT(*) as count FROM dining_item_metadata;

-- Check what auth.role() returns for anon
SELECT 'anon auth.role() with simple secure policy' as test, auth.role() as role;

-- Test with service role
SET ROLE service_role;
SELECT 'service_role test with simple secure policy' as test, COUNT(*) as count FROM dining_item_metadata;

-- Reset role
RESET ROLE;

-- Fix RLS policy on APPLICATION DATABASE (pmjaldcpjhxkwwrrgfvz.supabase.co)
-- This is the database the application actually connects to

-- Check current RLS policy
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'dining_item_metadata';

-- Update RLS policy to allow anon access
DROP POLICY IF EXISTS "Enable read access for all users" ON dining_item_metadata;

CREATE POLICY "Enable read access for all users" ON dining_item_metadata
FOR SELECT USING (
    (auth.role() = 'authenticated'::text) OR 
    (auth.role() = 'public'::text) OR 
    (auth.role() IS NULL)
);

-- Test the policy
SET ROLE anon;
SELECT 'anon role test' as test, COUNT(*) as count FROM dining_item_metadata;

SET ROLE service_role;
SELECT 'service_role test' as test, COUNT(*) as count FROM dining_item_metadata;

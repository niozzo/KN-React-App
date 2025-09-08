# RLS Policy Setup Guide for Database Owner

**Generated:** 2025-09-08  
**Purpose:** Guide for database owner to configure RLS policies for public API access

## Current Situation

Based on ADR-001 analysis, the database has:
- ✅ **RLS Enabled**: All 11 tables have Row Level Security enabled
- ❌ **No Public Policies**: No RLS policies allow public API key access
- ❌ **Data Inaccessible**: Public API key cannot read data (returns 0 rows)

## Required RLS Policies

The database owner needs to create RLS policies for each table to allow the public API key to read data.

### 1. **Attendees Table** (222 rows - Primary data)

```sql
-- Allow public read access to attendees
CREATE POLICY "Allow public read access on attendees" 
ON attendees 
FOR SELECT 
USING (true);

-- Optional: Allow public to update their own profile (if needed)
CREATE POLICY "Allow public to update own attendee profile" 
ON attendees 
FOR UPDATE 
USING (auth.uid()::text = id);
```

### 2. **Agenda Items Table** (Event sessions)

```sql
-- Allow public read access to agenda items
CREATE POLICY "Allow public read access on agenda_items" 
ON agenda_items 
FOR SELECT 
USING (true);
```

### 3. **Dining Options Table** (Dining events)

```sql
-- Allow public read access to dining options
CREATE POLICY "Allow public read access on dining_options" 
ON dining_options 
FOR SELECT 
USING (true);
```

### 4. **Hotels Table** (Accommodation)

```sql
-- Allow public read access to hotels
CREATE POLICY "Allow public read access on hotels" 
ON hotels 
FOR SELECT 
USING (true);
```

### 5. **Sponsors Table** (27 rows - Sponsor directory)

```sql
-- Allow public read access to sponsors
CREATE POLICY "Allow public read access on sponsors" 
ON sponsors 
FOR SELECT 
USING (true);
```

### 6. **Seat Assignments Table** (29 rows - Seating data)

```sql
-- Allow public read access to seat assignments
CREATE POLICY "Allow public read access on seat_assignments" 
ON seat_assignments 
FOR SELECT 
USING (true);
```

### 7. **Admin-Only Tables** (Optional - for admin tools)

```sql
-- These tables are admin-only, but if needed for admin tools:
CREATE POLICY "Allow public read access on seating_configurations" 
ON seating_configurations 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access on layout_templates" 
ON layout_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access on breakout_sessions" 
ON breakout_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access on import_history" 
ON import_history 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access on user_profiles" 
ON user_profiles 
FOR SELECT 
USING (true);
```

## Complete Setup Script

Here's a complete SQL script the database owner can run:

```sql
-- =====================================================
-- RLS Policies for Public API Access
-- Run this script in Supabase SQL Editor
-- =====================================================

-- 1. Attendees (Primary data - 222 rows)
CREATE POLICY "Allow public read access on attendees" 
ON attendees 
FOR SELECT 
USING (true);

-- 2. Agenda Items (Event sessions)
CREATE POLICY "Allow public read access on agenda_items" 
ON agenda_items 
FOR SELECT 
USING (true);

-- 3. Dining Options (Dining events)
CREATE POLICY "Allow public read access on dining_options" 
ON dining_options 
FOR SELECT 
USING (true);

-- 4. Hotels (Accommodation)
CREATE POLICY "Allow public read access on hotels" 
ON hotels 
FOR SELECT 
USING (true);

-- 5. Sponsors (Sponsor directory - 27 rows)
CREATE POLICY "Allow public read access on sponsors" 
ON sponsors 
FOR SELECT 
USING (true);

-- 6. Seat Assignments (Seating data - 29 rows)
CREATE POLICY "Allow public read access on seat_assignments" 
ON seat_assignments 
FOR SELECT 
USING (true);

-- 7. Admin-Only Tables (Optional)
CREATE POLICY "Allow public read access on seating_configurations" 
ON seating_configurations 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access on layout_templates" 
ON layout_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access on breakout_sessions" 
ON breakout_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access on import_history" 
ON import_history 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access on user_profiles" 
ON user_profiles 
FOR SELECT 
USING (true);

-- =====================================================
-- Verification Queries
-- Run these to verify policies are working
-- =====================================================

-- Test attendees access
SELECT COUNT(*) as attendee_count FROM attendees;

-- Test sponsors access  
SELECT COUNT(*) as sponsor_count FROM sponsors;

-- Test seat assignments access
SELECT COUNT(*) as seat_assignment_count FROM seat_assignments;

-- Test all tables access
SELECT 
  'attendees' as table_name, COUNT(*) as row_count FROM attendees
UNION ALL
SELECT 
  'sponsors' as table_name, COUNT(*) as row_count FROM sponsors
UNION ALL
SELECT 
  'seat_assignments' as table_name, COUNT(*) as row_count FROM seat_assignments
UNION ALL
SELECT 
  'agenda_items' as table_name, COUNT(*) as row_count FROM agenda_items
UNION ALL
SELECT 
  'dining_options' as table_name, COUNT(*) as row_count FROM dining_options
UNION ALL
SELECT 
  'hotels' as table_name, COUNT(*) as row_count FROM hotels;
```

## Step-by-Step Instructions

### **For Database Owner:**

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Setup Script**
   - Copy the complete SQL script above
   - Paste it into the SQL Editor
   - Execute the script

3. **Verify Policies Are Created**
   - Go to Authentication → Policies
   - Verify that policies exist for all tables
   - Check that policies allow SELECT operations

4. **Test Public API Access**
   - Use the verification queries in the script
   - Confirm that data is now accessible via public API key

### **Expected Results After Setup:**

```sql
-- These queries should now return data instead of 0 rows:
SELECT COUNT(*) FROM attendees;        -- Should return 222
SELECT COUNT(*) FROM sponsors;         -- Should return 27  
SELECT COUNT(*) FROM seat_assignments; -- Should return 29
```

## Security Considerations

### **What These Policies Allow:**
- ✅ **Read Access**: Public API key can read all data
- ✅ **Application Functionality**: Enables the React app to work
- ✅ **Data Display**: Users can view attendees, events, sponsors, etc.

### **What These Policies Don't Allow:**
- ❌ **Write Access**: Public API key cannot modify data
- ❌ **Delete Access**: Public API key cannot delete data
- ❌ **Admin Operations**: Public API key cannot perform admin functions

### **Additional Security (Optional):**

If you want more restrictive access, you can modify the policies:

```sql
-- Example: Only allow read access to active records
CREATE POLICY "Allow public read access on active sponsors" 
ON sponsors 
FOR SELECT 
USING (active = true);

-- Example: Only allow read access to confirmed attendees
CREATE POLICY "Allow public read access on confirmed attendees" 
ON attendees 
FOR SELECT 
USING (registration_status = 'confirmed');
```

## Troubleshooting

### **If Policies Don't Work:**

1. **Check RLS Status:**
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Verify Policy Creation:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

3. **Test with Public API Key:**
   ```javascript
   // Test in browser console or application
   const { data, error } = await supabase
     .from('attendees')
     .select('*')
     .limit(1);
   
   console.log('Data:', data);
   console.log('Error:', error);
   ```

## Next Steps

After setting up the RLS policies:

1. **Test the React Application** - Verify data loads correctly
2. **Monitor Performance** - Check API response times
3. **Review Security** - Ensure policies meet security requirements
4. **Document Changes** - Update any security documentation

## Summary

The database owner needs to run the SQL script above to create RLS policies that allow the public API key to read data from all tables. This will enable the React application to access the 278 rows of data across the 6 core tables.

**Expected Result**: After running the script, the public API key will be able to read all data, and the React application will function correctly.

---

*This guide provides the exact steps needed to enable public API access while maintaining RLS security.*


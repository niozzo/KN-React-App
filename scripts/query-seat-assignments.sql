-- Query seat assignments for a specific table
-- This script allows you to see who is assigned to a given table

-- Example: Get all attendees at "Table 1"
SELECT 
    sa.id,
    sa.attendee_id,
    sa.table_name,
    sa.seat_number,
    sa.attendee_first_name,
    sa.attendee_last_name,
    sa.assignment_type,
    sa.assigned_at,
    sa.notes,
    sa.created_at,
    sa.updated_at
FROM seat_assignments sa
WHERE sa.table_name = 'Table 1'
ORDER BY sa.seat_number;

-- Example: Get all attendees at "Table 2" 
-- (uncomment and modify as needed)
/*
SELECT 
    sa.id,
    sa.attendee_id,
    sa.table_name,
    sa.seat_number,
    sa.attendee_first_name,
    sa.attendee_last_name,
    sa.assignment_type,
    sa.assigned_at,
    sa.notes,
    sa.created_at,
    sa.updated_at
FROM seat_assignments sa
WHERE sa.table_name = 'Table 2'
ORDER BY sa.seat_number;
*/

-- Example: Get all unique tables that have assignments
SELECT DISTINCT table_name, COUNT(*) as attendee_count
FROM seat_assignments 
WHERE table_name IS NOT NULL
GROUP BY table_name
ORDER BY table_name;

-- Example: Get all seat assignments (overview)
SELECT 
    table_name,
    COUNT(*) as total_attendees,
    MIN(seat_number) as min_seat,
    MAX(seat_number) as max_seat
FROM seat_assignments 
WHERE table_name IS NOT NULL
GROUP BY table_name
ORDER BY table_name;

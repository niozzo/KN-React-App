# Supabase RLS Authentication Troubleshooting Guide

**CRITICAL**: This document addresses a recurring issue with database access that has been troubleshooted multiple times.

## Problem Description

The Supabase database (`iikcgdhztkrexuuqheli.supabase.co`) uses Row Level Security (RLS) policies that block anonymous access to data.

### Symptoms
- ✅ Anonymous Supabase API can discover table names
- ❌ Anonymous Supabase API returns 0 rows for all tables
- ❌ Data access fails (returns empty arrays)
- ✅ Admin interface works because it uses authenticated access

### Root Cause
Row Level Security (RLS) policies are configured to block anonymous users from accessing data, even though they can see the table structure.

## Solution

**ALWAYS use authenticated access with admin credentials:**

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iikcgdhztkrexuuqheli.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8';

// Create client
const supabase = createClient(supabaseUrl, supabaseKey);

// REQUIRED: Authenticate before accessing data
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'ishan.gammampila@apax.com',
  password: 'xx8kRx#tn@R?'
});

if (error) {
  console.error('Authentication failed:', error.message);
  return;
}

// Now data access will work
const { data: attendees } = await supabase.from('attendees').select('*');
```

## Actual Database Contents (with authenticated access)

| Table | Rows | Status |
|-------|------|--------|
| `attendees` | 235 | ✅ Populated |
| `agenda_items` | 8 | ✅ Populated |
| `sponsors` | 27 | ✅ Populated |
| `seat_assignments` | 48 | ✅ Populated |
| `dining_options` | 2 | ✅ Populated |
| `hotels` | 3 | ✅ Populated |
| `seating_configurations` | 2 | ✅ Populated |
| `user_profiles` | 1 | ✅ Populated |

## Key Points for Agents

1. **This is a recurring issue** - has been troubleshooted multiple times
2. **Always check authentication first** when database queries return empty results
3. **Anonymous access is blocked by RLS** - must use authenticated access
4. **Admin interface works** because it uses the same authenticated approach
5. **All services must use authenticated Supabase client** for data access

## Testing the Solution

Use the spike server to test database access:

```bash
# Start the spike server (uses authenticated access)
npm run spike

# Test endpoints
curl http://localhost:3000/api/db/tables
curl http://localhost:3000/api/db/table-data?table=agenda_items&limit=5
```

## Related Documents

- `docs/spikes/vercel-database-spike/SPIKE-DEPLOYMENT.md` - Complete spike documentation
- `docs/architecture/database-schema.md` - Database schema reference
- `scripts/spike-server.js` - Working implementation with authentication

## Last Updated

2025-09-13 - Second occurrence of this issue resolved

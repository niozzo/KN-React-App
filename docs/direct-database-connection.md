# Direct Database Connection Implementation

## Overview
This document describes the implementation of direct PostgreSQL database connection capabilities alongside the existing Supabase API connection.

## Implementation Details

### 1. Database Configuration
- **File**: `config/database.js`
- **Purpose**: Centralized configuration for both Supabase API and direct PostgreSQL connections
- **Credentials**: Uses environment variables from .env.local file for security

### 2. Direct Database Module
- **File**: `lib/direct-db.js`
- **Purpose**: Provides read-only PostgreSQL connection using the `pg` library
- **Features**:
  - Connection pooling for performance
  - Read-only access (SELECT queries only)
  - Comprehensive error handling
  - Table discovery and structure analysis
  - Sample data retrieval with row counts

### 3. Updated Supabase Library
- **File**: `lib/supabase.js`
- **Changes**: 
  - Now imports from centralized config
  - Re-exports direct database functions for convenience
  - Maintains backward compatibility with existing Supabase API functions

### 4. Enhanced Connection Test Component
- **File**: `components/ConnectionTest.js`
- **New Features**:
  - Toggle between Supabase API and Direct PostgreSQL connections
  - Visual indicators for connection type
  - Row count display for direct connections
  - Enhanced error handling and user feedback

## Available Database Tables
The direct connection has access to 11 tables:
1. `agenda_items` - Event agenda items
2. `attendees` - Event attendees
3. `breakout_sessions` - Breakout session details
4. `dining_options` - Dining options for events
5. `hotels` - Hotel information
6. `import_history` - Data import tracking
7. `layout_templates` - Layout templates
8. `seat_assignments` - Seat assignment data
9. `seating_configurations` - Seating configuration details
10. `sponsors` - Sponsor information
11. `user_profiles` - User profile data

## Connection Methods

### Supabase API Connection
- **Pros**: 
  - Respects Row Level Security (RLS) policies
  - Built-in authentication and authorization
  - Real-time subscriptions support
- **Cons**: 
  - Limited by RLS policies
  - May not show all data depending on permissions

### Direct PostgreSQL Connection
- **Pros**: 
  - Full read access to all tables
  - Better performance for large datasets
  - Complete table structure information
  - Row count statistics
- **Cons**: 
  - Read-only access only
  - Bypasses Supabase security policies
  - Requires direct database credentials

## Security Considerations
- Direct connection is read-only (SELECT queries only)
- Credentials are stored in configuration files (should be moved to environment variables in production)
- Connection pooling with limited concurrent connections
- SSL/TLS encryption enabled

## Usage Instructions

### For Developers
1. Use the ConnectionTest component to explore both connection methods
2. Switch between "Supabase API" and "Direct PostgreSQL" buttons
3. Compare data availability and performance between methods
4. Use direct connection for data analysis and reporting

### For Production
1. Move database credentials to environment variables
2. Implement proper credential rotation
3. Monitor connection pool usage
4. Consider implementing connection limits per user

## Testing
- Run `node test-direct-connection.js` to test direct database connection
- Use the web interface at `http://localhost:3000` to test both connection methods
- Verify table access and data retrieval for both connection types

## Dependencies Added
- `pg`: PostgreSQL client for Node.js
- Updated package.json to specify ES module type

## Files Modified/Created
- ✅ `config/database.js` - New configuration file
- ✅ `lib/direct-db.js` - New direct database module
- ✅ `lib/supabase.js` - Updated to support both connection types
- ✅ `components/ConnectionTest.js` - Enhanced with dual connection support
- ✅ `package.json` - Added pg dependency and ES module type
- ✅ `test-direct-connection.js` - Test script for direct connection
- ✅ `docs/direct-database-connection.md` - This documentation

## Related Documentation
- **[ADR-001: Supabase RLS Bypass Strategy](../architecture/ADR-001-supabase-rls-bypass.md)** - Architectural decision record
- **[RLS Solution Guide](../architecture/RLS-Solution-Guide.md)** - Complete implementation guide
- **[Final File Structure](../architecture/File-Structure.md)** - Current project structure

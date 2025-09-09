# Scripts Directory

This directory contains utility scripts and development tools for the Knowledge Now React App.

## Database Analysis Scripts

### `analyze-database-structure.js`
- **Purpose**: Analyze database structure and generate documentation
- **Usage**: `node scripts/analyze-database-structure.js`
- **Output**: Database structure analysis and documentation

### `show-table-counts.js`
- **Purpose**: Display row counts for all database tables
- **Usage**: `node scripts/show-table-counts.js`
- **Output**: Table name and row count summary

### `create-sample-tables.sql`
- **Purpose**: SQL script for creating sample database tables
- **Usage**: Execute in database management tool
- **Note**: Reference implementation for table structure

## Development Tools

### `server-with-auth.js`
- **Purpose**: Local Express server with auto-login functionality
- **Usage**: `npm run server` (defined in package.json)
- **Features**: 
  - Serves test pages with authentication
  - Auto-injects credentials from environment variables
  - Used for local development and testing

## Environment Setup

### Environment Variables
Copy `docs/env-template.txt` to `.env.local` and configure:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_USER_EMAIL`
- `SUPABASE_USER_PASSWORD`

## Usage Notes

- All scripts require proper environment configuration
- Database scripts require authenticated Supabase access
- Development server requires Node.js and npm dependencies
- Scripts are designed for development and analysis purposes

## Integration

These scripts support:
- Database schema analysis and documentation
- Local development and testing
- Data structure verification
- Development workflow automation

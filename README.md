# KN React App - Database Connection & Analysis Tool

This React application provides comprehensive database connection testing and analysis capabilities for Supabase databases with Row Level Security (RLS) support.

## Features

- ✅ **Dual Connection Testing** - Test both Supabase API and direct PostgreSQL connections
- 📊 **Table Discovery** - List all available tables in your database
- 🔍 **Table Structure Analysis** - View column details, types, and constraints
- 📋 **Data Access** - Preview actual data from tables (RLS-compliant)
- 🎨 **Modern UI** - Clean, responsive interface with Tailwind CSS
- 🛡️ **Security** - Read-only access with credential protection
- 🪑 **Seat Assignment Normalization** - Per-user seat assignment processing for October 21st events

## Recent Fixes

### ✅ Seat Assignment Normalization Fix (2025-01-27)
- **Issue**: Normalization was processing all 249 attendees instead of current user only
- **Solution**: Fixed duplicate variable declaration and corrected data flow
- **Result**: Per-user processing with proper normalization during both initial load and background refreshes
- **Documentation**: See `docs/architecture/seat-assignment-normalization-fix.md`

## Quick Start

### 1. Setup Environment

First, ensure your database credentials are configured:

```bash
# Check if .env.local exists
cat .env.local

# If not, create it with your database credentials
# See deployment.md for details
```

### 2. Run the Application

```bash
# Start the main application
npm start
# Then visit: http://localhost:3000

# Or use development mode
npm run dev
```

### 3. Available Commands

```bash
# Test direct database connection
npm run test-connection

# Show table row counts (CLI)
npm run show-counts

# Start main application
npm start
```

### 4. Test Connections

The app provides:
- **Supabase API Connection** - For user data access (RLS-compliant)
- **Direct PostgreSQL Connection** - For system metadata and structure
- **Dual Interface** - Switch between connection types
- **Real-time Testing** - Test connections and view results

## Database Configuration

Your Supabase configuration is already set up:

- **URL**: `https://iikcgdhztkrexuuqheli.supabase.co`
- **API Key**: Configured (anon key)
- **Database**: PostgreSQL with public schema access

## What You Can Do

1. **View Connection Status** - See if the connection is successful
2. **Browse Tables** - Click on any table to explore it
3. **Examine Structure** - View column names, types, and constraints
4. **Preview Data** - See sample data from each table
5. **Refresh** - Test the connection again anytime

## File Structure

```
KN-React-App/
├── 📄 index.html                    # Main React application
├── 📁 components/                   # React components
│   └── ConnectionTest.js           # Connection test component
├── 📁 config/                      # Configuration files
│   └── database.js                 # Database configuration
├── 📁 lib/                         # Core libraries
│   ├── direct-db.js                # Direct PostgreSQL module
│   └── supabase.js                 # Supabase integration
├── 📁 docs/                        # Documentation
│   ├── 📁 architecture/            # Architecture documentation
│   │   ├── ADR-003-vercel-spike-solution.md
│   │   ├── database-schema.md
│   │   └── File-Structure-Analysis.md
│   ├── direct-database-connection.md
│   └── Brownfield Story Implementation Guide.md
├── 📁 utils/                       # Utility functions
├── 📁 web-bundles/                 # BMAD agent files
├── 📄 .env.local                   # Environment variables (gitignored)
├── 📄 .gitignore                   # Git ignore rules
├── 📄 create-sample-tables.sql     # Database schema
├── 📄 deployment.md                # Deployment documentation
├── 📄 package.json                 # Dependencies & scripts
├── 📄 package-lock.json            # Lock file
├── 📄 README.md                    # This file
└── 📄 test-direct-connection.js    # Direct connection test
```

## Architecture & Documentation

### RLS Solution
This application implements a **Row Level Security (RLS) bypass strategy** using dual connections:
- **Supabase API**: For user data access (respects RLS policies)
- **Direct PostgreSQL**: For system metadata (bypasses RLS for structure)

### Key Documentation
- **[ADR-003: Vercel Spike Solution](docs/architecture/ADR-003-vercel-spike-solution.md)** - Working database connection solution
- **[Database Schema](docs/architecture/database-schema.md)** - Complete database schema reference
- **[File Structure Analysis](docs/architecture/File-Structure-Analysis.md)** - Cleanup recommendations and final structure
- **[Deployment Guide](deployment.md)** - Deployment and configuration instructions

## Next Steps

Once you've verified the connection and explored your tables, you can:

1. **Build a full React app** using the components in the `components/` folder
2. **Add authentication** using Supabase Auth
3. **Create data management features** based on your table structure
4. **Implement real-time updates** using Supabase subscriptions
5. **Extend the dual connection pattern** for other database operations

## Troubleshooting

If you encounter issues:

1. **Check your internet connection**
2. **Verify database credentials** in `.env.local`
3. **Ensure your Supabase project is active**
4. **Check browser console** for detailed error messages
5. **Test direct connection**: `npm run test-connection`
6. **Check table counts**: `npm run show-counts`

## Security Features

This application implements security best practices:
- ✅ **Environment Variables** - Credentials stored securely in `.env.local`
- ✅ **Read-Only Access** - Direct connection limited to SELECT queries
- ✅ **RLS Compliance** - User data accessed through Supabase API
- ✅ **Connection Pooling** - Limited concurrent connections
- ✅ **SSL/TLS** - All connections encrypted
- ✅ **Gitignore Protection** - Sensitive files never committed

# Deployment Configuration

## Live Application URLs

### Production URL
- **URL**: https://kn-react-9rmn34mxu-nick-iozzos-projects.vercel.app
- **Status**: ✅ Live and accessible
- **Deployment Date**: September 7, 2025
- **Last Update**: Fixed connection test method

### Vercel Dashboard
- **Project**: kn-react-app
- **Scope**: nick-iozzos-projects
- **Inspect URL**: https://vercel.com/nick-iozzos-projects/kn-react-app/ZGeKiRzcZ9iTPS3ht2sFskLqYtCN

## Environment Variables (To Set)
- `NEXT_PUBLIC_SUPABASE_URL`: https://iikcgdhztkrexuuqheli.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: [Set in Vercel Dashboard]

## Database Dependencies
### Supabase Configuration for Seth's KN db
- **Project URL**: https://iikcgdhztkrexuuqheli.supabase.co
- **Public API Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2NnZGh6dGtyZXh1dXFoZWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzY3NDEsImV4cCI6MjA3MjYxMjc0MX0.N3KNNn6N_S4qPlBeclj07QsekCeZnF_FkBKef96XnO8

- **Database Host**: db.iikcgdhztkrexuuqheli.supabase.co
- **Database Port**: 5432
- **Database Name**: postgres

### 🔐 Database Credentials Storage
**IMPORTANT**: Sensitive database credentials are now stored securely in environment variables.

#### Local Development Credentials
- **Location**: `.env.local` file (in project root)
- **Status**: ✅ Gitignored - Never committed to repository
- **Contains**: Database username, password, and connection details

#### How to Access/Edit Credentials:
1. **View current credentials**:
   ```bash
   cat .env.local
   ```

2. **Edit credentials** (using your preferred editor):
   ```bash
   nano .env.local
   # or
   code .env.local
   # or
   vim .env.local
   ```

3. **Test connection after changes**:
   ```bash
   node test-direct-connection.js
   ```

#### Environment Variables in .env.local:
```bash
# Supabase Configuration (Public - Safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://iikcgdhztkrexuuqheli.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Direct Database Connection (PRIVATE - Never commit to git)
DB_HOST=db.iikcgdhztkrexuuqheli.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_SSL=true
```

#### Security Notes:
- ✅ `.env.local` is automatically gitignored
- ✅ Credentials are never exposed in code or documentation
- ✅ Safe to push to GitHub without exposing sensitive data
- ✅ Credentials are automatically loaded when running Node.js scripts

## RLS Solution Implementation

### Problem Solved
The application now successfully handles **Row Level Security (RLS)** constraints in the Supabase database. All public tables have RLS enabled, which blocks direct PostgreSQL access to user data.

### Solution Architecture
- **Supabase API**: Used for user data access (table counts, records)
- **Direct PostgreSQL**: Used for system metadata (table structure, schema)
- **Dual Connection**: Provides flexibility while maintaining security

### Working Features
- ✅ **Table Counts**: Displays actual row counts (e.g., 222 attendees)
- ✅ **Data Access**: Retrieves user data through RLS-compliant API
- ✅ **Connection Testing**: Tests both Supabase API and direct connections
- ✅ **Security**: Maintains read-only access and credential protection

## Next Steps
1. ✅ Deploy to Vercel - COMPLETED
2. ✅ RLS Solution - COMPLETED
3. ⏳ Set environment variables in Vercel dashboard
4. ⏳ Test live connection to Supabase database
5. ⏳ Create sample tables in Supabase

## Commands

### Main Application
- **Start app**: `npm start` (port 3000)
- **Development**: `npm run dev` (alias for start)
- **Redeploy**: `vercel --prod`

### Testing & Analysis
- **Test connection**: `npm run test-connection`
- **Show counts**: `npm run show-counts`
- **Direct test**: `node test-direct-connection.js`

### Legacy Commands (Deprecated)
- ~~`node serve-counts.js`~~ - Consolidated into main app
- ~~`node api-server.js`~~ - Consolidated into main app

## Architecture Documentation
- **ADR-001**: [Supabase RLS Bypass Strategy](docs/architecture/ADR-001-supabase-rls-bypass.md)
- **RLS Guide**: [RLS Solution Guide](docs/architecture/RLS-Solution-Guide.md)
- **File Structure**: [Final File Structure](docs/architecture/File-Structure.md)
- **Cleanup Analysis**: [File Structure Analysis](docs/architecture/File-Structure-Analysis.md) (historical)

## Consolidated Architecture

### Simplified File Structure
After cleanup, the application now has a streamlined structure:
- **Single Entry Point**: `index.html` serves all functionality
- **Consolidated Scripts**: All functionality accessible via npm scripts
- **Unified Interface**: Dual connection testing in one application
- **Reduced Complexity**: Eliminated redundant servers and files

### Benefits of Consolidation
- ✅ **Reduced Maintenance** - Fewer files to manage
- ✅ **Simplified Deployment** - Single application to deploy
- ✅ **Better Performance** - No multiple server overhead
- ✅ **Easier Development** - Clear, single codebase
- ✅ **Improved Security** - Centralized credential management

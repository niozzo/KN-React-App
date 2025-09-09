# Database API Spike - Deployment Guide

## 🚀 Vercel Deployment

This spike implements server-side API routes for direct PostgreSQL database access on Vercel.

### 📁 Files Created

#### API Routes (`api/`)
- `api/health.js` - Health check endpoint
- `api/db/test-connection.js` - Test database connectivity
- `api/db/tables.js` - Get all tables
- `api/db/table-data.js` - Get table data with pagination
- `api/db/table-count.js` - Get row counts
- `api/db/table-structure.js` - Get table schema
- `api/db/discover-tables.js` - Dynamic table discovery

#### Client
- `spike-client.html` - Simple client to test the API

#### Configuration
- `vercel.json` - Updated for API routes
- `package.json` - Added Node.js engine requirement

### 🔧 Environment Variables Required

Set these in your Vercel dashboard:

```bash
# Database Connection
DB_HOST=db.iikcgdhztkrexuuqheli.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=your_database_username
DB_PASSWORD=your_database_password

# Supabase API (for reference)
NEXT_PUBLIC_SUPABASE_URL=https://iikcgdhztkrexuuqheli.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 🚀 Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Add the environment variables listed above
   - Redeploy if needed

### 🧪 Testing the Spike

1. **Health Check**: `GET /api/health`
2. **Database Connection**: `GET /api/db/test-connection`
3. **Get Tables**: `GET /api/db/tables`
4. **Get Table Data**: `GET /api/db/table-data?table=table_name&limit=10`
5. **Get Row Count**: `GET /api/db/table-count?table=table_name`

### 📊 Client Interface

Visit the deployed URL to access the spike client interface that will:
- Test API connectivity
- Test database connectivity
- Display all tables with row counts
- Show database summary statistics

### 🔒 Security Notes

- Database credentials are kept server-side only
- API endpoints only allow GET requests
- Input validation on all parameters
- SQL injection protection via parameterized queries
- Rate limiting should be added for production

### 🎯 Next Steps

This spike proves that:
- ✅ Direct PostgreSQL access works on Vercel
- ✅ API routes can serve database data securely
- ✅ Client-side can consume the API
- ✅ Same functionality as local direct connection

For production, consider adding:
- Authentication/authorization
- Rate limiting
- Response caching
- Error monitoring
- API documentation

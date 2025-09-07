# KN React App - Supabase Connection Test

This React application demonstrates how to connect to your Supabase database and explore the available tables.

## Features

- ✅ **Connection Testing** - Verify Supabase connection
- 📊 **Table Discovery** - List all available tables in your database
- 🔍 **Table Structure** - View column details, types, and constraints
- 📋 **Sample Data** - Preview actual data from tables
- 🎨 **Modern UI** - Clean, responsive interface with Tailwind CSS

## Quick Start

### 1. Open the Application

Simply open `index.html` in your browser, or run a local server:

```bash
# Option 1: Open directly in browser
open index.html

# Option 2: Run local server
npm start
# Then visit: http://localhost:3000
```

### 2. Test Connection

The app will automatically:
- Test the connection to your Supabase database
- Display connection status
- List all available tables
- Allow you to explore table structure and data

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
├── index.html              # Main application (standalone)
├── lib/
│   └── supabase.js         # Supabase client and utilities
├── components/
│   └── ConnectionTest.js   # React component (for build tools)
├── .env.local              # Environment variables
└── package.json            # Dependencies and scripts
```

## Next Steps

Once you've verified the connection and explored your tables, you can:

1. **Build a full React app** using the components in the `components/` folder
2. **Add authentication** using Supabase Auth
3. **Create data management features** based on your table structure
4. **Implement real-time updates** using Supabase subscriptions

## Troubleshooting

If you encounter issues:

1. **Check your internet connection**
2. **Verify Supabase credentials** in `.env.local`
3. **Ensure your Supabase project is active**
4. **Check browser console** for detailed error messages

## Security Note

This demo uses the public anon key for demonstration. In production:
- Use environment variables
- Implement proper authentication
- Set up Row Level Security (RLS) policies
- Use service role keys only on the server side

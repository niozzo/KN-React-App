# Table Assignments Implementation Guide

**Story:** 3.4.1 - SPIKE - Application DB Population & Data Review  
**Status:** Implementation Complete  
**Date:** 2025-01-27  

## Overview

This document describes the implementation of the table assignments cache system for dining events. The system processes seat assignments from the main database and stores computed table companion data in the Application DB for fast access by the frontend widget.

## Architecture

### Database Design

**Application DB Table: `table_assignments_cache`**
```sql
CREATE TABLE table_assignments_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dining_option_id UUID NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  attendees JSONB NOT NULL, -- Array of all attendees at this table
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one cache entry per table per dining event
  UNIQUE(dining_option_id, table_name)
);
```

### API Endpoints

**1. Single Table Processing: `/api/sync-table-assignments-single`**
- Processes Table 1 for sanity check
- READ-ONLY access to main DB
- WRITE-ONLY to Application DB
- Returns table data for validation

**2. Full Population: `/api/sync-table-assignments-full`**
- Processes all tables after validation
- READ-ONLY access to main DB
- WRITE-ONLY to Application DB
- Clears existing cache and populates all tables

## Implementation Files

### API Endpoints
- `api/sync-table-assignments-single.js` - Single table processing
- `api/sync-table-assignments-full.js` - Full population processing

### Database Setup
- `scripts/create-table-assignments-cache.sql` - SQL schema
- `scripts/setup-application-db.js` - Database setup script

### Testing
- `scripts/test-table-assignments-api.js` - API endpoint testing

### Package Scripts
- `npm run setup-app-db` - Setup Application DB
- `npm run test-table-api` - Test API endpoints

## Data Flow

### 1. Single Table Processing
```
Main DB (READ-ONLY) → Process Table 1 → Application DB (WRITE)
```

### 2. Full Population
```
Main DB (READ-ONLY) → Process All Tables → Application DB (WRITE)
```

### 3. Widget Access
```
Application DB (READ) → localStorage Cache → Widget Display
```

## Data Structure

### Input (from Main DB)
```json
{
  "id": "uuid",
  "attendee_id": "uuid",
  "table_name": "Table 1",
  "dining_option_id": "uuid",
  "event_type": "dining"
}
```

### Output (to Application DB)
```json
{
  "dining_option_id": "uuid",
  "table_name": "Table 1",
  "attendees": [
    {
      "attendee_id": "uuid",
      "first_name": "John",
      "last_name": "Smith",
      "company_name_standardized": "Acme Corp",
      "photo": "photo_url"
    }
  ]
}
```

## Setup Instructions

### 1. Environment Variables
Ensure these environment variables are set:
```bash
VITE_APPLICATION_DB_URL=your_application_db_url
VITE_APPLICATION_DB_ANON_KEY=your_application_db_key
VITE_SUPABASE_URL=your_main_db_url
VITE_SUPABASE_ANON_KEY=your_main_db_key
```

### 2. Database Setup
```bash
# Setup Application DB table
npm run setup-app-db
```

### 3. Test API Endpoints
```bash
# Test single table processing
npm run test-table-api
```

### 4. Manual Testing
```bash
# Test single table endpoint
curl https://your-app.vercel.app/api/sync-table-assignments-single

# Test full population endpoint
curl https://your-app.vercel.app/api/sync-table-assignments-full
```

## Database Guardrails

### ✅ READ-ONLY Main DB Access
- Only reads data from main database
- No writes, updates, or deletes to main DB
- No schema changes to main DB
- No admin operations on main DB

### ✅ WRITE-ONLY Application DB Access
- All writes go to Application DB only
- Cache operations in Application DB only
- Computed data stored in Application DB only

## Error Handling

### API Error Responses
- **404**: No seat assignments found
- **500**: Database connection errors
- **500**: Data processing errors
- **500**: Application DB write errors

### Fallback Strategies
- Graceful error handling for missing data
- Detailed error messages for debugging
- Stack traces in development mode

## Performance Considerations

### Processing Efficiency
- Table-based processing (faster than individual attendee processing)
- Batch operations for multiple tables
- Optimized database queries

### Caching Strategy
- Application DB as primary cache
- localStorage as secondary cache
- Background sync for updates

## Testing

### Unit Tests
- API endpoint functionality
- Data transformation logic
- Error handling scenarios

### Integration Tests
- Database connectivity
- Data flow validation
- Cache population verification

### Manual Testing
- Single table processing
- Full population processing
- Data structure validation

## Monitoring

### Success Metrics
- API response times
- Data processing accuracy
- Cache hit rates
- Error rates

### Logging
- API request/response logging
- Database operation logging
- Error tracking and debugging

## Next Steps

### Phase 1: Validation (Current)
- [x] Application DB schema created
- [x] API endpoints implemented
- [x] Single table processing working
- [x] Full population processing working
- [x] Database guardrails enforced

### Phase 2: Frontend Integration (Next)
- [ ] Widget component implementation
- [ ] localStorage integration
- [ ] Background sync integration
- [ ] UI/UX implementation

## Troubleshooting

### Common Issues

**1. Database Connection Errors**
- Verify environment variables
- Check database credentials
- Test database connectivity

**2. No Data Found**
- Check if Table 1 exists
- Verify seat assignments exist
- Check event_type = 'dining'

**3. Application DB Write Errors**
- Verify Application DB permissions
- Check table schema
- Test data insertion manually

### Debug Commands
```bash
# Test database connectivity
npm run test-connection

# Check table counts
npm run show-counts

# Test API endpoints
npm run test-table-api
```

## Security Considerations

### Data Protection
- READ-ONLY access to main DB
- No sensitive data exposure
- Proper error handling
- Input validation

### Access Control
- Environment variable protection
- Database credential security
- API endpoint authentication

## Conclusion

The table assignments implementation provides a robust, scalable solution for caching dining event table companion data. The system follows strict database guardrails, implements comprehensive error handling, and provides efficient data processing for the frontend widget.

The implementation is ready for Phase 2 (Frontend Integration) and provides a solid foundation for the dining table companions widget feature.

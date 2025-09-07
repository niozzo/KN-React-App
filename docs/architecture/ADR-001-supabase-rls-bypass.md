# ADR-001: Supabase Row Level Security (RLS) Bypass Strategy

## Status
**ACCEPTED** - January 2025

## Context
The Knowledge Now React application required direct database access to display table counts and data analysis. Initial attempts to use direct PostgreSQL connections revealed that all public tables have Row Level Security (RLS) enabled, which blocks direct database queries from returning data even with valid credentials.

### Problem Statement
- Direct PostgreSQL connection returns 0 rows for all tables despite data existing
- RLS policies prevent direct database access to user data
- Need to display actual table counts and data for application functionality
- Security requirements mandate read-only access only

### Technical Investigation
```sql
-- RLS Status Check Query
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Result**: All 11 public tables have `rowsecurity = true`

## Decision
**Use Supabase API for data access instead of direct PostgreSQL connection**

### Rationale
1. **RLS Compatibility**: Supabase API is designed to work with RLS policies
2. **Security Compliance**: Maintains existing security model
3. **Data Access**: Successfully retrieves actual data (e.g., 222 rows in attendees table)
4. **Authentication**: Uses existing Supabase authentication system
5. **Performance**: Adequate for read-only operations and table counts

### Alternative Approaches Considered
1. **Direct PostgreSQL with RLS Bypass**: 
   - ❌ Would require disabling RLS (security risk)
   - ❌ Would require service role credentials (elevated permissions)
   
2. **Custom RLS Policies**:
   - ❌ Complex to implement for read-only access
   - ❌ May conflict with existing security model

3. **Database Views with RLS**:
   - ❌ Additional complexity
   - ❌ Maintenance overhead

## Implementation Details

### Architecture Pattern
```
Browser Application
       ↓
Supabase JavaScript Client
       ↓
Supabase API Gateway
       ↓
PostgreSQL Database (with RLS)
```

### Key Components
1. **Frontend**: React components using `@supabase/supabase-js`
2. **API Layer**: Supabase API handles RLS policy evaluation
3. **Database**: PostgreSQL with RLS enabled on all tables

### Code Implementation
```javascript
// Supabase client configuration
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Table count retrieval
const getTableCount = async (tableName) => {
    const { count, error } = await supabaseClient
        .from(tableName)
        .select('*', { count: 'exact', head: true });
    
    return { count, error };
};
```

## Consequences

### Positive
- ✅ **Data Access**: Successfully retrieves actual table data
- ✅ **Security**: Maintains RLS security model
- ✅ **Simplicity**: Uses existing Supabase infrastructure
- ✅ **Performance**: Adequate for read-only operations
- ✅ **Maintenance**: Leverages Supabase's managed service

### Negative
- ⚠️ **API Dependency**: Relies on Supabase API availability
- ⚠️ **Rate Limits**: Subject to Supabase API rate limiting
- ⚠️ **Network Latency**: Additional network hop through API
- ⚠️ **RLS Constraints**: Limited by existing RLS policies

### Risks
- **API Outage**: Supabase API unavailability affects data access
- **Rate Limiting**: High-volume operations may hit API limits
- **Policy Changes**: RLS policy modifications could break access

## Mitigation Strategies
1. **Error Handling**: Implement robust error handling for API failures
2. **Caching**: Cache table counts to reduce API calls
3. **Fallback**: Maintain direct connection capability for admin operations
4. **Monitoring**: Monitor API usage and performance

## Related Decisions
- **ADR-002**: Environment Variable Security Strategy
- **ADR-003**: Dual Connection Architecture Pattern

## References
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

## Review Date
**Next Review**: March 2025 (Quarterly)

---
*This ADR documents the architectural decision to use Supabase API for data access in the Knowledge Now React application, addressing RLS constraints while maintaining security and functionality.*

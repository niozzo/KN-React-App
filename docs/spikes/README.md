# Spikes Directory

This directory contains the results and documentation from various technical spikes conducted during the Knowledge Now React App development.

## Spike Results

### 1. Vercel Database Spike (`vercel-database-spike/`)

**Objective**: Determine how to connect to the Supabase database from a Vercel deployment.

**Key Findings**:
- ✅ **Solution**: Authenticated Supabase API via Vercel serverless functions
- ✅ **Authentication**: Server-side authentication with user credentials
- ✅ **RLS Bypass**: Authenticated requests bypass Row Level Security policies
- ✅ **Deployment**: Successfully deployed and tested on Vercel
- ⚠️ **CRITICAL**: Database uses RLS policies - anonymous access returns 0 rows
- ✅ **Solution**: Use admin credentials for authenticated access to bypass RLS

**Files**:
- `spike-client.html` - Working client-side interface for testing API endpoints
- `SPIKE-DEPLOYMENT.md` - Complete deployment guide and troubleshooting steps
- `api/` - Complete API implementation with all database endpoints

**API Endpoints Created**:
- `/api/db/test-connection` - Test database connectivity
- `/api/db/tables` - Get list of tables with row counts
- `/api/db/table-count` - Get row count for specific table
- `/api/db/table-data` - Get sample data from specific table
- `/api/db/table-structure` - Get table schema information
- `/api/db/discover-tables` - Dynamically discover available tables

**Architecture Decision**: Documented in `docs/architecture/ADR-003-vercel-spike-solution.md`

### 2. Application Data Storage Spike (`application-data-storage-spike.md`)

**Objective**: Determine the optimal approach for storing user-specific application data that cannot be stored in the read-only conference database.

**Key Findings**:
- ✅ **Problem Identified**: Need separate storage for meet lists, user preferences, and personal data
- ✅ **Approaches Evaluated**: Separate Supabase project, local storage, Vercel KV, hybrid approach
- ✅ **Recommendation**: Hybrid approach with local storage + cloud sync
- ✅ **Privacy Considerations**: GDPR compliance and data minimization requirements
- ✅ **Schema Design**: Complete database schema for user data tables

**Files**:
- `application-data-storage-spike.md` - Comprehensive analysis and recommendations

**Key Requirements**:
- Meet lists persistence (Story 3.2)
- User preferences and privacy settings (Story 6.1)
- Session feedback storage (Story 7.2)
- Personal bookmarks (Story 7.3)
- Offline-first functionality
- Cross-device synchronization
- GDPR compliance

**Architecture Decision**: Pending implementation and validation

### 3. Legacy Spikes (`legacy/`)

**Files**:
- `index.html` - Original local test page with "Direct PostgreSQL" button
- `deployment.md` - Early deployment documentation

**Note**: These files are kept for historical reference but are no longer actively used.

## Knowledge Retention

Each spike directory contains:
- **Objective**: What we were trying to solve
- **Approach**: How we approached the problem
- **Results**: What we learned and discovered
- **Working Code**: Functional examples that can be referenced
- **Documentation**: Step-by-step guides for replication

## Usage

These spikes serve as:
1. **Reference Implementation**: Working examples of database connectivity
2. **Troubleshooting Guide**: Solutions to common deployment issues
3. **Architecture Foundation**: Basis for production implementation
4. **Knowledge Base**: Historical record of technical decisions

## Next Steps

When implementing production features:
1. Reference the working spike implementations
2. Adapt the authentication patterns for production use
3. Use the API endpoint patterns as templates
4. Follow the deployment patterns established in the spikes

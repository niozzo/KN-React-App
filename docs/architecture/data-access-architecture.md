# Data Access Architecture

**Version:** 2.0  
**Last Updated:** 2025-01-16  
**Status:** CRITICAL - Prevents Infrastructure Issues  

## Overview

This document defines the **mandatory data access patterns** for the Knowledge Now React application to prevent infrastructure issues and ensure proper separation between local development and production environments.

**NEW (2025-01-16)**: Multi-Project Supabase Strategy for Application Data Management

## ⚠️ CRITICAL: Environment-Based Data Access

### **Local Development Mode**
- **Data Source**: Local API endpoints (`/api/*`)
- **Database**: No direct database connections
- **Authentication**: Mock authentication for development
- **Schema Validation**: Uses expected schemas, no live database queries

### **Production Mode**
- **External Data Source**: Authenticated Supabase API (conference data)
- **Application Data Source**: Separate Supabase project (speaker assignments, metadata)
- **Database**: Direct Supabase connections with RLS
- **Authentication**: Full authentication flow
- **Schema Validation**: Live database schema validation

## Data Access Layers

### **1. Multi-Project Supabase Architecture**

**NEW (2025-01-16)**: Application Database Strategy

```mermaid
graph TD
    A[React Application] --> B[External Data Service]
    A --> C[Application Data Service]
    
    B --> D[External Supabase Project]
    B --> E[Conference Data]
    B --> F[Attendees, Agenda Items]
    
    C --> G[Application Supabase Project]
    C --> H[Speaker Assignments]
    C --> I[Metadata Cache]
    
    D --> J[Read-Only Access]
    G --> K[Full CRUD Access]
    
    style D fill:#e3f2fd
    style G fill:#f3e5f5
    style E fill:#e8f5e8
    style H fill:#fff3e0
```

**Database Projects:**
- **External Project**: `iikcgdhztkrexuuqheli.supabase.co` (conference data)
- **Application Project**: `kn-react-app-application-data.supabase.co` (speaker assignments)
- **Future Projects**: Additional Supabase projects as needed

### **2. Service Layer Architecture**

```typescript
// ✅ CORRECT: Environment-aware service layer with dual database support
class DataService {
  private isLocalMode(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.NODE_ENV === 'test' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  async getData(): Promise<Data> {
    if (this.isLocalMode()) {
      return this.getLocalData();
    }
    return this.getProductionData();
  }
}

// ✅ NEW: Application Database Service
class ApplicationDatabaseService {
  private applicationDb: SupabaseClient;
  
  constructor() {
    this.applicationDb = createClient(
      process.env.VITE_APPLICATION_DB_URL!,
      process.env.VITE_APPLICATION_DB_ANON_KEY!
    );
  }

  async getSpeakerAssignments(agendaItemId: string): Promise<SpeakerAssignment[]> {
    const { data, error } = await this.applicationDb
      .from('speaker_assignments')
      .select('*')
      .eq('agenda_item_id', agendaItemId);
    
    if (error) throw error;
    return data || [];
  }

  async assignSpeaker(agendaItemId: string, attendeeId: string, role: string = 'presenter'): Promise<SpeakerAssignment> {
    const { data, error } = await this.applicationDb
      .from('speaker_assignments')
      .insert({
        agenda_item_id: agendaItemId,
        attendee_id: attendeeId,
        role
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
```

### **2. Local Development Data Flow**

```mermaid
graph TD
    A[React Component] --> B[useSessionData Hook]
    B --> C[agendaService]
    C --> D[Local API Endpoint]
    D --> E[Mock Data Response]
    E --> F[Component State]
    
    G[Schema Validation] --> H[Expected Schemas]
    H --> I[No Database Queries]
    
    style D fill:#e1f5fe
    style E fill:#e8f5e8
    style I fill:#e8f5e8
```

### **3. Production Data Flow**

```mermaid
graph TD
    A[React Component] --> B[useSessionData Hook]
    B --> C[agendaService]
    C --> D[Supabase API]
    D --> E[RLS-Authenticated Query]
    E --> F[Live Database]
    F --> G[Component State]
    
    H[Schema Validation] --> I[Live Schema Queries]
    I --> J[information_schema Tables]
    
    style D fill:#fff3e0
    style E fill:#fff3e0
    style J fill:#fff3e0
```

## Mandatory Implementation Patterns

### **1. Environment Detection**

**✅ REQUIRED**: All services must implement environment detection:

```typescript
// src/services/baseService.ts
export abstract class BaseService {
  protected isLocalMode(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.NODE_ENV === 'test' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  protected getApiBaseUrl(): string {
    return this.isLocalMode() ? '/api' : 'https://iikcgdhztkrexuuqheli.supabase.co';
  }
}
```

### **2. Schema Validation Service**

**✅ REQUIRED**: Schema validation must skip Supabase queries in local mode:

```typescript
// src/services/schemaValidationService.ts
export class SchemaValidationService {
  private isLocalMode(): boolean {
    return process.env.NODE_ENV === 'development' || 
           process.env.NODE_ENV === 'test' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  }

  private async getAllTables(): Promise<TableSchema[]> {
    // Skip Supabase queries in local mode
    if (this.isLocalMode()) {
      console.log('🏠 Local mode detected - skipping Supabase schema validation');
      return this.getExpectedTables();
    }
    
    // Production: Use live Supabase queries
    return this.queryLiveSchema();
  }
}
```

### **3. Data Service Implementation**

**✅ REQUIRED**: Data services must use local APIs in development:

```typescript
// src/services/dataService.ts
export class DataService extends BaseService {
  async getCurrentAttendeeData(): Promise<Attendee | null> {
    if (this.isLocalMode()) {
      // Local development: Use mock data or local API
      return this.getLocalAttendeeData();
    }
    
    // Production: Use Supabase API
    return this.getSupabaseAttendeeData();
  }
}
```

## Service-Specific Requirements

### **Agenda Service**

```typescript
// src/services/agendaService.ts
export class AgendaService extends BaseService {
  private getBasePath(): string {
    return this.isLocalMode() ? '/api/agenda-items' : '/rest/v1/agenda_items';
  }

  async getActiveAgendaItems(): Promise<PaginatedResponse<AgendaItem>> {
    const path = this.getBasePath();
    // Implementation handles both local and production endpoints
  }
}
```

### **PWA Data Sync Service**

```typescript
// src/services/pwaDataSyncService.ts
export class PWADataSyncService {
  constructor() {
    // Only initialize schema validation in production
    if (!this.isLocalMode()) {
      this.schemaValidator = new SchemaValidationService();
    }
  }
}
```

## Error Handling Patterns

### **1. API Error Handling**

```typescript
// src/services/dataService.ts
const apiGet = async <T>(path: string): Promise<T> => {
  const response = await fetch(path, { credentials: 'include' });
  
  // Check content type before parsing to prevent HTML parsing errors
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    console.error(`❌ API returned non-JSON content: ${contentType} for path: ${path}`);
    throw new DataServiceError(`Expected JSON but got ${contentType || 'unknown content type'}`, 'INVALID_CONTENT_TYPE');
  }
  
  // Rest of implementation...
};
```

### **2. localStorage-First Data Access Pattern**

```typescript
// src/services/dataService.ts
export const getCurrentAttendeeData = async (): Promise<Attendee | null> => {
  requireAuthentication()
  
  try {
    const current = (await import('./authService.js')).getCurrentAttendee?.()
    if (!current?.id) return null
    
    // PRIMARY: Check localStorage first (populated during login)
    try {
      const cachedData = localStorage.getItem('kn_cache_attendees')
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData)
        // Handle both direct array format and wrapped format
        const attendees = cacheObj.data || cacheObj
        const cachedAttendee = attendees.find((a: Attendee) => a.id === current.id)
        if (cachedAttendee) {
          console.log('✅ Using cached attendee data from localStorage')
          return cachedAttendee
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached attendee data:', cacheError)
    }
    
    // FALLBACK: API call if no cached data exists
    console.log('🌐 No cached data found, fetching from API...')
    const data = await apiGet<Attendee>(`/api/attendees/${current.id}`)
    return data
    
  } catch (error) {
    console.error('❌ Error fetching current attendee:', error)
    throw new DataServiceError('Failed to fetch current attendee data', 'FETCH_ERROR')
  }
}
```

### **3. Performance Benefits**

- **Instant Loading**: ~1000x faster data access from localStorage
- **Offline Capability**: Works without network dependency
- **Reduced Server Load**: Fewer API calls
- **Better UX**: Immediate data availability

## Testing Requirements

### **1. Environment Mocking**

```typescript
// src/__tests__/setup/testSetup.ts
beforeEach(() => {
  // Mock environment detection
  vi.stubEnv('NODE_ENV', 'test');
  
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });
});
```

### **2. Service Testing**

```typescript
// src/__tests__/services/dataService.test.ts
describe('DataService Environment Detection', () => {
  it('should use local mode in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const service = new DataService();
    expect(service.isLocalMode()).toBe(true);
  });

  it('should use production mode in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const service = new DataService();
    expect(service.isLocalMode()).toBe(false);
  });
});
```

## Deployment Considerations

### **1. Environment Variables**

```bash
# .env.development
NODE_ENV=development
VITE_API_BASE_URL=/api
VITE_USE_LOCAL_DATA=true

# .env.production
NODE_ENV=production
VITE_API_BASE_URL=https://iikcgdhztkrexuuqheli.supabase.co
VITE_USE_LOCAL_DATA=false
```

### **2. Build Configuration**

```typescript
// vite.config.ts
export default defineConfig({
  define: {
    __LOCAL_MODE__: process.env.NODE_ENV === 'development'
  }
});
```

## Monitoring and Debugging

### **1. Console Logging**

```typescript
// All services should log environment mode
console.log('🏠 Local mode detected - using local data sources');
console.log('🌐 Production mode detected - using Supabase API');
```

### **2. Error Tracking**

```typescript
// Track environment-specific errors
if (this.isLocalMode()) {
  console.error('❌ Local API error:', error);
} else {
  console.error('❌ Supabase API error:', error);
}
```

## Security Architecture Integration

### **🔒 Authentication-First Data Access Pattern**

**CRITICAL SECURITY UPDATE (2025-01-16)**: The data access architecture now implements a **security-first pattern** that prevents unauthorized data access:

```typescript
// ✅ SECURE: Authentication-First Data Access
export const getCurrentAttendeeData = async (): Promise<Attendee | null> => {
  requireAuthentication() // Security gate - must be authenticated first
  
  try {
    const current = (await import('./authService.js')).getCurrentAttendee?.()
    if (!current?.id) return null
    
    // PRIMARY: Check localStorage first (populated during login)
    try {
      const cachedData = localStorage.getItem('kn_cache_attendees')
      if (cachedData) {
        const cacheObj = JSON.parse(cachedData)
        const attendees = cacheObj.data || cacheObj
        const cachedAttendee = attendees.find((a: Attendee) => a.id === current.id)
        if (cachedAttendee) {
          console.log('🏠 LOCALSTORAGE: Using cached attendee data from localStorage')
          return cachedAttendee
        }
      }
    } catch (cacheError) {
      console.warn('⚠️ Failed to load cached attendee data:', cacheError)
    }
    
    // FALLBACK: API call if no cached data exists
    console.log('🌐 API: No cached data found, fetching from API...')
    const data = await apiGet<Attendee[]>(`/api/attendees`)
    const attendee = data.find(a => a.id === current.id)
    return attendee || current as Attendee
    
  } catch (error) {
    console.error('❌ Error fetching current attendee:', error)
    throw new DataServiceError('Failed to fetch current attendee data', 'FETCH_ERROR')
  }
}
```

### **🛡️ Data Leakage Prevention**

The architecture now includes comprehensive data leakage prevention:

```typescript
// Clear all cached data on authentication failure
const clearCachedData = useCallback(() => {
  try {
    console.log('🧹 Clearing cached data due to authentication failure...')
    
    // Clear all kn_cache_ keys from localStorage
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('kn_cache_')) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      console.log(`🧹 Removed cached data: ${key}`)
    })
    
    // Clear authentication state
    localStorage.removeItem('conference_auth')
    console.log('🧹 Cleared authentication state')
    
    console.log('✅ All cached data cleared')
  } catch (error) {
    console.warn('⚠️ Error clearing cached data:', error)
  }
}, [])
```

## Migration Checklist

### **✅ Completed**
- [x] Schema validation service updated with local mode detection
- [x] Data service enhanced with content-type validation
- [x] Cache fallback mechanisms implemented
- [x] Error handling improved for HTML responses
- [x] **CRITICAL**: Authentication-first data access pattern implemented
- [x] **CRITICAL**: Data leakage prevention mechanisms added
- [x] **CRITICAL**: Security-first authentication flow implemented

### **🔄 In Progress**
- [ ] Update all service classes to extend BaseService
- [ ] Implement environment detection in all data access points
- [ ] Add comprehensive testing for environment modes
- [ ] Update documentation for all affected services

### **📅 Planned**
- [ ] Create environment-specific configuration files
- [ ] Implement automated environment detection testing
- [ ] Add monitoring for environment-specific errors
- [ ] Create deployment scripts for environment management

## Related Documents

- **Database Schema**: `docs/architecture/database-schema.md`
- **PWA Architecture**: `docs/architecture/pwa-architecture.md`
- **Supabase RLS Troubleshooting**: `docs/architecture/supabase-rls-troubleshooting.md`
- **Frontend Architecture**: `docs/architecture/frontend-refactoring-plan.md`

## Success Metrics

- **✅ No Supabase 404 Errors**: Schema validation skips live queries in local mode
- **✅ Local Development Works**: All features function without external dependencies
- **✅ Production Integration**: Full Supabase functionality in production
- **✅ Cache Fallback**: Graceful degradation when APIs fail
- **✅ Environment Detection**: Automatic mode switching based on environment

---

**This architecture ensures that Story 2.1 and future stories work correctly in both local development and production environments without infrastructure conflicts.**

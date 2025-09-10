# Application Data Storage Spike

## Objective
Determine the optimal approach for storing user-specific application data that cannot be stored in the read-only conference database. This includes meet lists, user preferences, privacy settings, and other personal data that requires write access.

## Problem Statement
The current architecture provides read-only access to the conference database (Supabase) containing attendees, sessions, and other conference data. However, the application requires storage for:

- **Meet Lists**: Private lists of attendees users want to meet (Story 3.2)
- **User Preferences**: Privacy settings, notification preferences, discoverability toggles
- **Session Feedback**: User ratings and feedback for sessions (Story 7.2)
- **Personal Bookmarks**: Saved sessions and resources (Story 7.3)
- **Authentication Data**: User sessions, OTP verification status
- **Analytics Data**: User behavior tracking and engagement metrics

## Current Architecture Constraints
- **Read-Only Conference Database**: Cannot store user-specific data
- **Supabase RLS**: Row Level Security policies prevent user data storage
- **PWA Requirements**: Must work offline and sync when online
- **Privacy Requirements**: GDPR compliance and data minimization
- **Authentication**: 6-digit access codes + email OTP system

## Technical Approaches to Evaluate

### Approach 1: Separate Supabase Project for User Data
**Pros:**
- Consistent with existing Supabase infrastructure
- Built-in authentication and RLS
- Real-time capabilities for live updates
- Familiar development patterns

**Cons:**
- Additional project complexity
- Potential data synchronization issues
- Higher costs for separate project
- Cross-project data relationships

**Implementation:**
```typescript
// User data Supabase client
const userDataClient = createClient(
  process.env.NEXT_PUBLIC_USER_DATA_SUPABASE_URL,
  process.env.NEXT_PUBLIC_USER_DATA_SUPABASE_ANON_KEY
)

// User data tables
interface UserMeetList {
  id: string
  user_id: string
  attendee_id: string
  created_at: string
}

interface UserPreferences {
  id: string
  user_id: string
  discoverability_enabled: boolean
  notifications_enabled: boolean
  privacy_level: 'public' | 'private' | 'hidden'
}
```

### Approach 2: Local Storage + Cloud Sync
**Pros:**
- Excellent offline performance
- No additional infrastructure costs
- Simple implementation
- GDPR-friendly (local data)

**Cons:**
- Limited storage capacity
- No cross-device synchronization
- Data loss risk
- Manual sync complexity

**Implementation:**
```typescript
// Local storage service
class LocalDataService {
  private storage = localStorage
  
  saveMeetList(attendeeId: string) {
    const meetList = this.getMeetList()
    if (!meetList.includes(attendeeId)) {
      meetList.push(attendeeId)
      this.storage.setItem('meetList', JSON.stringify(meetList))
    }
  }
  
  getMeetList(): string[] {
    return JSON.parse(this.storage.getItem('meetList') || '[]')
  }
}
```

### Approach 3: Vercel KV (Redis) for User Data
**Pros:**
- Serverless and scalable
- Fast key-value operations
- Built-in TTL for session data
- Cost-effective for small data

**Cons:**
- No relational queries
- Limited data modeling
- Vendor lock-in
- No built-in authentication

**Implementation:**
```typescript
// Vercel KV service
import { kv } from '@vercel/kv'

class VercelKVService {
  async saveMeetList(userId: string, attendeeIds: string[]) {
    await kv.set(`meetList:${userId}`, attendeeIds, { ex: 86400 * 30 }) // 30 days
  }
  
  async getMeetList(userId: string): Promise<string[]> {
    return await kv.get(`meetList:${userId}`) || []
  }
}
```

### Approach 4: Hybrid Approach (Recommended)
**Combination of local storage + cloud backup**

**Architecture:**
- **Primary**: Local storage for immediate access and offline functionality
- **Backup**: Cloud storage (Supabase or Vercel KV) for cross-device sync
- **Sync**: Background synchronization when online

**Implementation:**
```typescript
class HybridDataService {
  private localService: LocalDataService
  private cloudService: CloudDataService
  
  async saveMeetList(attendeeId: string) {
    // Save locally first (immediate)
    this.localService.saveMeetList(attendeeId)
    
    // Sync to cloud in background
    if (navigator.onLine) {
      await this.cloudService.syncMeetList()
    }
  }
  
  async syncData() {
    if (navigator.onLine) {
      const localData = this.localService.getAllData()
      await this.cloudService.syncAllData(localData)
    }
  }
}
```

## Data Schema Design

### User Data Tables
```sql
-- User profiles (linked to conference attendees)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_attendee_id TEXT REFERENCES attendees(id),
  email TEXT UNIQUE,
  access_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Meet lists
CREATE TABLE user_meet_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  attendee_id TEXT REFERENCES attendees(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, attendee_id)
);

-- User preferences
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  discoverability_enabled BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  privacy_level TEXT DEFAULT 'private',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Session feedback
CREATE TABLE session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  session_id TEXT REFERENCES agenda_items(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Personal bookmarks
CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  resource_type TEXT, -- 'session', 'sponsor', 'attendee'
  resource_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, resource_type, resource_id)
);
```

## Privacy & Security Considerations

### Data Minimization
- Store only essential user data
- Implement data retention policies
- Provide data deletion capabilities

### GDPR Compliance
- User consent for data collection
- Right to data portability
- Right to erasure
- Data processing transparency

### Security Measures
- Encrypt sensitive data at rest
- Use secure authentication tokens
- Implement rate limiting
- Regular security audits

## Performance Requirements

### Offline-First Design
- All user data available offline
- Background sync when online
- Conflict resolution for concurrent edits

### Response Times
- Local operations: < 50ms
- Cloud sync: < 2s
- Initial load: < 1s

### Storage Limits
- Local storage: ~5-10MB per user
- Cloud storage: Unlimited (with cost monitoring)

## Implementation Plan

### Phase 1: Local Storage Foundation
1. Implement local storage service
2. Create data models and interfaces
3. Build offline-first data layer
4. Test offline functionality

### Phase 2: Cloud Sync Integration
1. Choose cloud storage solution
2. Implement sync service
3. Add conflict resolution
4. Test cross-device synchronization

### Phase 3: Privacy & Security
1. Implement GDPR compliance
2. Add data encryption
3. Create privacy controls
4. Security testing

### Phase 4: Performance Optimization
1. Implement caching strategies
2. Optimize sync algorithms
3. Add performance monitoring
4. Load testing

## Success Criteria

### Functional Requirements
- [ ] Meet lists persist across sessions
- [ ] User preferences are saved and applied
- [ ] Offline functionality works completely
- [ ] Cross-device synchronization works
- [ ] Data can be exported/deleted per GDPR

### Performance Requirements
- [ ] Local operations complete in < 50ms
- [ ] App loads in < 1s with cached data
- [ ] Sync completes in < 2s
- [ ] Works on low-end mobile devices

### Privacy Requirements
- [ ] GDPR compliance implemented
- [ ] User consent properly managed
- [ ] Data minimization applied
- [ ] Privacy controls functional

## Risk Assessment

### High Risk
- **Data Loss**: Local storage can be cleared by user/browser
- **Sync Conflicts**: Concurrent edits on multiple devices
- **Privacy Breaches**: Sensitive user data exposure

### Medium Risk
- **Performance Issues**: Large datasets affecting app performance
- **Storage Limits**: Browser storage limitations
- **Network Dependencies**: Cloud sync failures

### Low Risk
- **Vendor Lock-in**: Cloud provider dependencies
- **Cost Overruns**: Unexpected storage costs

## Recommendations

### Primary Recommendation: Hybrid Approach
1. **Local Storage** for immediate access and offline functionality
2. **Supabase User Data Project** for cloud backup and sync
3. **Background Sync** for seamless user experience
4. **Privacy-First Design** with GDPR compliance

### Implementation Priority
1. Start with local storage for MVP
2. Add cloud sync for production
3. Implement privacy controls
4. Optimize performance

## Next Steps
1. **Spike Implementation**: Build proof-of-concept for hybrid approach
2. **Architecture Decision**: Document final approach in ADR
3. **Development Planning**: Create detailed implementation tasks
4. **Security Review**: Conduct privacy and security assessment

## References
- [Story 3.2: Meet List Management](../stories/3.2.meet-list-management.md)
- [Story 6.1: Privacy Controls & GDPR Compliance](../stories/6.1.privacy-controls-gdpr-compliance.md)
- [Story 7.2: Session Feedback System](../stories/7.2.session-feedback-system.md)
- [Story 7.3: Post-Conference Content Hub](../stories/7.3.post-conference-content-hub.md)
- [Technical Preferences](../../.bmad-core/data/technical-preferences.md)
- [Database Schema Reference](../architecture/database-schema.md)

# ADR-004: QR Code Generator & URL-Based Auto-Login

**Status:** ✅ Implemented  
**Date:** 2025-10-12  
**Architect:** Winston 🏗️  
**Dev Lead:** James (Full Stack Developer)  
**Commits:** `18dbad4`, `f95f06a`, `faaab2c`, `aacff85`

## Context

Admin users needed a way to distribute attendee access codes via shareable URLs and QR codes rather than manually sharing 6-character codes. This required:

1. **Admin Interface**: Ability to generate QR codes and URLs for specific attendees
2. **Auto-Login**: Attendees visiting URLs with embedded access codes should automatically authenticate
3. **Security**: URL parameters must be cleared immediately and access codes kept confidential
4. **UX**: Loading indicators during auto-login, dropdown-based attendee selection

## Decision

### Architecture Pattern: Service Layer + Nested Routing

Implemented using existing architecture patterns:

**Data Access:**
```typescript
// Architecture-Compliant Pattern
import { supabase } from '../lib/supabase'; // External DB (attendees, conference data)
// NOT: SupabaseClientFactory.getInstance() - doesn't exist
```

**Admin Routing:**
```typescript
<Route path="/admin" element={<AdminApp />}>
  <Route index element={<AdminDashboard />} />        // /admin
  <Route path="manage" element={<AdminPage />} />     // /admin/manage
  <Route path="qr-generator" element={<QRCodeGenerator />} /> // /admin/qr-generator
</Route>
```

**Outlet Pattern:**
```typescript
// AdminApp.tsx - Pass context to nested routes
return <Outlet context={{ onLogout: handleLogout }} />;

// Child components access context
const { onLogout } = useOutletContext<OutletContext>();
```

### Key Components

#### 1. Admin Dashboard (`src/components/admin/AdminDashboard.tsx`)

**Purpose**: Navigation hub for admin functions

**Features:**
- Material-UI Card-based navigation
- Links to Agenda Management and QR Code Generator
- Consistent styling with existing admin components
- Responsive grid layout

**Dependencies:**
```typescript
import { Box, Grid, Card, CardContent, Typography, AppBar, Toolbar, Button } from '@mui/material';
import { Dashboard as DashboardIcon, QrCode2 as QrCodeIcon } from '@mui/icons-material';
```

#### 2. QR Code Generator (`src/components/admin/QRCodeGenerator.tsx`)

**Purpose**: Generate QR codes and shareable URLs for attendee access

**Features:**
- **Attendee Selection**: MUI Autocomplete with 2-character minimum search
- **QR Generation**: Client-side using `qrcode.react` library
- **URL Format**: `${window.location.origin}/login?code=${accessCode}`
- **Actions**: Copy URL to clipboard, Download QR code as PNG
- **Filtering**: Search by name, email, or access code

**Key Implementation:**
```typescript
// MUI Autocomplete with custom filtering
<Autocomplete
  options={attendees}
  filterOptions={(options, state) => {
    // Only show results after 2 characters typed
    if (state.inputValue.trim().length < 2) return [];
    
    const query = state.inputValue.toLowerCase();
    return options.filter(option =>
      option.first_name.toLowerCase().includes(query) ||
      option.last_name.toLowerCase().includes(query) ||
      option.email.toLowerCase().includes(query) ||
      option.access_code.toLowerCase().includes(query)
    );
  }}
  noOptionsText="Enter at least 2 characters to search"
/>

// QR Code Generation
<QRCodeSVG
  value={generateURL(selectedAttendee.access_code)}
  size={256}
  level="H"
  includeMargin={true}
/>

// Download QR as PNG (SVG to Canvas conversion)
const handleDownloadQR = () => {
  const svg = document.getElementById('qr-code-svg');
  const canvas = document.createElement('canvas');
  // ... SVG serialization and canvas drawing ...
  canvas.toBlob((blob) => {
    const link = document.createElement('a');
    link.download = `qr-code-${attendee.first_name}-${attendee.last_name}.png`;
    link.href = URL.createObjectURL(blob);
    link.click();
  });
};
```

#### 3. Admin Service Extension (`src/services/adminService.ts`)

**Method**: `getAllAttendeesWithAccessCodes()`

**Purpose**: Fetch attendees with access codes for QR generation

**Critical Architecture Decision:**
```typescript
// ✅ CORRECT - Uses singleton supabase from lib
import { supabase } from '../lib/supabase';

async getAllAttendeesWithAccessCodes(): Promise<AttendeeWithCode[]> {
  // ADMIN-ONLY: Fetch directly from Supabase
  // Note: access_code is filtered from cached data for security
  const { data, error } = await supabase
    .from('attendees')
    .select('id, first_name, last_name, email, access_code')
    .not('access_code', 'is', null)
    .order('last_name', { ascending: true });
    
  return data || [];
}
```

**Why Direct Database Access:**
- `access_code` field is intentionally filtered from client-side cache (`attendeeCacheFilterService.ts`) for security
- Admin functions require access to confidential data
- Uses existing authenticated `supabase` singleton client

#### 4. URL Parameter Auto-Login (`src/contexts/AuthContext.tsx`)

**Purpose**: Automatically authenticate users from URL with embedded access code

**Security-First Implementation:**
```typescript
const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
const location = useLocation();
const navigate = useNavigate();

useEffect(() => {
  const searchParams = new URLSearchParams(location.search);
  const codeParam = searchParams.get('code');
  
  if (codeParam && !autoLoginAttempted && !isLoading) {
    setAutoLoginAttempted(true);
    setIsLoading(true);
    
    // SECURITY: Clear URL parameter immediately (prevent sharing)
    searchParams.delete('code');
    navigate({ search: searchParams.toString() }, { replace: true });
    
    // Auto-submit login (reuses existing handleSubmit)
    handleSubmit(undefined, codeParam);
  }
}, [location.search, autoLoginAttempted, isLoading, navigate, handleSubmit]);
```

**UX Enhancements:**
```typescript
// Loading Indicator
<label>
  {autoLoginAttempted && isLoading 
    ? 'Logging you in...' 
    : 'Enter your 6-character access code'}
</label>

{isLoading && (
  <CircularProgress size={24} color="inherit" data-testid="loading-spinner" />
)}
```

## Technology Choices

### QR Code Library: `qrcode.react`

**Selected:** `qrcode.react` v3.1.0+

**Rationale:**
- ✅ React-friendly component API
- ✅ TypeScript support
- ✅ SVG output (scalable, high quality)
- ✅ Compatible with Material-UI
- ✅ Client-side generation (no server required)
- ✅ Configurable error correction levels

**Alternative Considered:**
- ❌ `qrcode` - Node.js focused, requires manual Canvas handling
- ❌ `react-qr-code` - Less maintained

### UI Framework: Material-UI (@mui/material)

**Already Used In:**
- AdminPage (speaker management)
- PasscodeScreen
- SpeakerAssignment
- MonitoringDashboard

**New Components Used:**
- `Autocomplete` - Dropdown attendee selector
- `Card`, `CardContent` - Layout containers
- `AppBar`, `Toolbar` - Navigation
- `Button`, `IconButton` - Actions
- `CircularProgress` - Loading states
- `Alert` - Success/error messages

**Version:** `^7.3.2`

### Routing Pattern: React Router Nested Routes

**Pattern:**
```typescript
// Parent route provides authentication and context
<Route path="/admin" element={<AdminApp />}>
  <Route index element={<AdminDashboard />} />
  <Route path="manage" element={<AdminPage />} />
  <Route path="qr-generator" element={<QRCodeGenerator />} />
</Route>
```

**Benefits:**
- ✅ Shared authentication layer (AdminApp)
- ✅ Centralized logout handler via Outlet context
- ✅ Cleaner URL structure (`/admin`, `/admin/manage`, `/admin/qr-generator`)
- ✅ Single authentication check for all admin routes

## Security Implementation

### 1. Admin-Only Access
- QR Generator behind admin passcode authentication
- PasscodeScreen gate before accessing any admin routes
- No direct URL access without authentication

### 2. URL Parameter Clearing
```typescript
// Immediate clearing prevents URL sharing with active session
searchParams.delete('code');
navigate({ search: searchParams.toString() }, { replace: true });
```

### 3. Confidential Data Filtering
- `access_code` filtered from client cache (`attendeeCacheFilterService.ts`)
- Only admin service methods can access codes
- Direct database query for admin functions only

### 4. No Logging of Access Codes
- Production logging excludes access codes
- Console logs for admin functions use emoji prefixes (🔐, ✅, ❌)
- No code leakage in error messages

## Database Access Architecture

### Multi-Project Supabase Pattern

**External Database** (Conference Data):
- URL: `iikcgdhztkrexuuqheli.supabase.co`
- Access via: `import { supabase } from '../lib/supabase'`
- Used for: attendees, agenda_items, sponsors (read-only)

**Application Database** (Metadata):
- URL: `kn-react-app-application-data.supabase.co`
- Access via: `ServiceRegistry.getInstance().getApplicationDbClient()`
- Used for: speaker_assignments, metadata (full CRUD)

**QR Generator Uses:**
- External DB for attendee data with access codes
- Singleton `supabase` client from `lib/supabase`
- Authenticated with RLS-compliant queries

## Performance Considerations

### 1. Client-Side QR Generation
- No server round-trip required
- Instant QR code display
- SVG format (scalable, small size)

### 2. Attendee Search Optimization
- 2-character minimum reduces unnecessary filtering
- MUI Autocomplete handles virtualization for large lists
- Filters 266+ attendees efficiently

### 3. Autocomplete Dropdown
- Only shows results when typing (no initial render of full list)
- Closes automatically on selection (reduces UI clutter)
- Searchable by multiple fields (name, email, code)

## User Experience Flow

### Admin Flow: Generate QR Code

1. **Navigate**: `/admin` → Click "QR Code Generator"
2. **Search**: Type 2+ characters in Autocomplete
3. **Select**: Click attendee from dropdown (closes automatically)
4. **Generate**: QR code and URL displayed instantly
5. **Share**: Copy URL or Download QR code

### Attendee Flow: Auto-Login

1. **Receive**: Get URL or QR code from admin
2. **Visit**: Navigate to `https://app.example.com/login?code=ABC123`
3. **Auto-Login**: See "Logging you in..." with spinner
4. **URL Cleared**: Parameter removed from browser (security)
5. **Authenticated**: Redirected to home page

## Testing Strategy

### Unit Tests
- ✅ `adminService.getAllAttendeesWithAccessCodes.test.ts` (8 tests passing)
  - Verifies direct Supabase access
  - Tests filtering, ordering, error handling
  - Mocks `supabase` from `lib/supabase`

### Integration Tests Needed
- [ ] Admin routing with nested routes
- [ ] Auto-login with URL parameters
- [ ] QR code generation and download
- [ ] Autocomplete filtering with 2-char minimum

### Security Tests Needed
- [ ] Access codes not exposed without authentication
- [ ] URL parameters cleared before storage
- [ ] No console logging of access codes in production

## Implementation Timeline

**2025-10-12 (Multiple Commits):**

**Commit `18dbad4`:** Architecture-compliant Supabase access fix
- Fixed `TypeError: e.getInstance is not a function`
- Changed from incorrect `SupabaseClientFactory.getInstance()` pattern
- Now uses `import { supabase } from '../lib/supabase'`
- Follows architecture documented in `data-access-architecture.md`

**Commit `f95f06a`:** 2-character minimum search filter
- Improved UX with minimum search length
- Prevents overwhelming UI with 266+ attendee list on load
- Clear messaging: "Enter at least 2 characters to search"

**Commit `faaab2c`:** MUI Autocomplete refactor
- Replaced TextField + List with Autocomplete component
- Dropdown auto-closes on selection
- Cleaner, more intuitive UI
- 71 fewer lines of code

**Commit `aacff85`:** Removed redundant display box
- Cleaned up UI clutter
- Selected attendee visible in Autocomplete field
- Full details shown in QR panel

## Files Modified

### New Files Created
- `src/components/admin/AdminDashboard.tsx` (Navigation hub)
- `src/components/admin/QRCodeGenerator.tsx` (QR generator)
- `src/__tests__/services/adminService.getAllAttendeesWithAccessCodes.test.ts` (Unit tests)
- `access-code-url-qr-generator.plan.md` (Implementation plan)
- `docs/architecture/ADR-004-qr-code-auto-login.md` (This document)

### Files Modified
- `src/services/adminService.ts` (Added `getAllAttendeesWithAccessCodes()`)
- `src/App.tsx` (Nested admin routing)
- `src/components/AdminApp.tsx` (Outlet pattern)
- `src/components/AdminPage.tsx` (Updated for Outlet context)
- `src/contexts/AuthContext.tsx` (URL parameter auto-login)
- `package.json` (Added `qrcode.react` dependency)

## Dependencies Added

```json
{
  "dependencies": {
    "qrcode.react": "^3.1.0"
  },
  "devDependencies": {
    "@types/qrcode.react": "^1.0.2"
  }
}
```

## Lessons Learned

### 1. Architecture Compliance Critical
- ❌ Initially used non-existent `SupabaseClientFactory.getInstance()` pattern
- ✅ Correct pattern: `import { supabase } from '../lib/supabase'`
- 📖 Lesson: Always verify architecture patterns in docs before implementation

### 2. User-Tested UX Improvements
- 🎯 2-character minimum: User feedback drove performance enhancement
- 🎯 Autocomplete dropdown: User requested "acts like a dropdown" behavior
- 🎯 Removed redundant display: User identified unnecessary UI element
- 📖 Lesson: Iterative UX refinement based on user feedback yields best results

### 3. Material-UI Consistency
- Already heavily used in admin components
- Autocomplete provided exactly the UX pattern needed
- Consistent styling across admin interface
- 📖 Lesson: Leverage existing UI framework for consistency

## Future Enhancements

### Potential Improvements
- [ ] Bulk QR code generation (ZIP download)
- [ ] QR code customization (colors, logo)
- [ ] Email integration (send QR directly to attendees)
- [ ] URL expiration/one-time use codes
- [ ] Analytics: Track QR code scans

### Known Limitations
- No server-side storage of generated URLs/QR codes
- No tracking of QR code usage
- Access codes never expire (by design)
- Manual distribution required (no automated sending)

## References

- [Implementation Plan](../../access-code-url-qr-generator.plan.md)
- [Data Access Architecture](./data-access-architecture.md)
- [Database Schema](./database-schema.md)
- [Supabase RLS Troubleshooting](./supabase-rls-troubleshooting.md)
- [Material-UI Documentation](https://mui.com/)
- [qrcode.react Library](https://www.npmjs.com/package/qrcode.react)

---

**Document Status:** ✅ Complete  
**Last Updated:** 2025-10-12  
**Maintained By:** Architecture Team


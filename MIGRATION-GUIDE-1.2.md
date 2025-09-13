# Migration Guide - Story 1.2: Supabase Integration

## 🎯 Overview

This guide covers the migration from direct Supabase client usage to a secure backend API architecture with RLS authentication.

## 🔄 Breaking Changes

### **Frontend Services**
- **Before**: Direct `supabase.from()` calls
- **After**: Backend API calls via `apiGet()` helper

### **Error Handling**
- **Before**: Supabase-specific error codes
- **After**: Backend API error codes with `authRequired` flag

### **Authentication**
- **Before**: Frontend handles auth (not implemented)
- **After**: Backend handles auth, frontend detects auth errors

## 📋 Migration Steps

### **1. Environment Variables**

Add to your `.env.local`:
```bash
# Supabase Configuration
SUPABASE_URL=https://iikcgdhztkrexuuqheli.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Authentication Credentials (for backend)
SUPABASE_USER_EMAIL=ishan.gammampila@apax.com
SUPABASE_USER_PASSWORD=xx8kRx#tn@R?
```

### **2. Backend API Setup**

Start the backend server:
```bash
npm run spike
```

Verify health:
```bash
curl http://localhost:3000/api/health
```

### **3. Frontend Service Updates**

All services now use backend endpoints:

```typescript
// Before
const { data, error } = await supabase
  .from('attendees')
  .select('*')

// After  
const data = await apiGet<Attendee[]>('/api/attendees')
```

### **4. Error Handling Updates**

```typescript
// Before
if (error) {
  throw new Error(error.message)
}

// After
try {
  const data = await apiGet('/api/endpoint')
} catch (error) {
  if (error.code === 'BACKEND_AUTH_REQUIRED') {
    // Handle auth error
  }
  throw error
}
```

## 🧪 Testing Updates

### **Mock Strategy**
- **Before**: Mock `supabase` client
- **After**: Mock `fetch` for API calls

### **Test Example**
```typescript
// Mock fetch responses
global.fetch = vi.fn()
  .mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: mockData })
  })
```

## 🚀 Deployment

### **Backend Deployment**
1. Deploy `scripts/spike-server.js` to your serverless platform
2. Set environment variables in production
3. Verify `/api/health` returns `authOk: true`

### **Frontend Deployment**
1. No changes needed - services automatically use backend
2. Ensure backend URL is accessible from frontend
3. Test data loading in production

## ⚠️ Common Issues

### **RLS Authentication Failures**
- **Symptom**: 0 rows returned, no clear error
- **Cause**: Backend using anonymous client instead of authenticated
- **Fix**: Check environment variables, restart backend

### **API Connection Errors**
- **Symptom**: `Failed to parse URL from /api/endpoint`
- **Cause**: Missing base URL in tests
- **Fix**: Mock `fetch` with full URLs or add base URL helper

### **Auth Error Detection**
- **Symptom**: Generic errors instead of auth-specific
- **Cause**: Backend not returning structured error responses
- **Fix**: Ensure backend uses `handleApiError()` helper

## 📊 Verification Checklist

### **Backend Verification**
- [ ] `/api/health` returns `authOk: true`
- [ ] `/api/attendees` returns 235 rows
- [ ] `/api/sponsors` returns 27 rows
- [ ] `/api/agenda-items` returns 8 rows

### **Frontend Verification**
- [ ] All services load data successfully
- [ ] Error handling works for auth failures
- [ ] PWA sync uses backend endpoints
- [ ] Tests pass (137/137)

### **Integration Verification**
- [ ] Spike page shows correct data counts
- [ ] Admin screen shows agenda items
- [ ] No direct Supabase client usage in frontend
- [ ] Environment variables properly configured

## 🔧 Troubleshooting

### **Debug Backend Auth**
```bash
# Check auth status
curl http://localhost:3000/api/health

# Test specific endpoint
curl http://localhost:3000/api/attendees?limit=1
```

### **Debug Frontend**
```javascript
// Check API calls in browser console
console.log('API calls:', fetch.mock?.calls)

// Check error handling
try {
  await dataService.getAttendees()
} catch (error) {
  console.log('Error code:', error.code)
}
```

## 📚 Additional Resources

- **RLS Troubleshooting**: `docs/architecture/supabase-rls-troubleshooting.md`
- **Release Notes**: `docs/architecture/RELEASE-NOTES-1.2.md`
- **Database Schema**: `docs/architecture/database-schema.md`
- **Story 1.2**: `docs/stories/1.2.supabase-integration-schema-setup.md`

## 🎯 Success Criteria

- [ ] All data loads correctly (attendees=235, sponsors=27, etc.)
- [ ] No direct Supabase client usage in frontend
- [ ] Backend handles authentication securely
- [ ] Error handling provides clear feedback
- [ ] All tests pass
- [ ] Documentation is comprehensive

---

**Migration Date**: January 2025  
**Story**: 1.2 - Supabase Integration & Schema Setup  
**Status**: ✅ Complete

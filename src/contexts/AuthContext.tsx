/**
 * Authentication Context for Access Code-based Authentication
 * 
 * Provides authentication state and methods throughout the app.
 * All data access requires authentication - no public data is available.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  signOut as authSignOut,
  getAuthStatus,
  authenticateWithAccessCode
} from '../services/authService'
import { serverDataSyncService } from '../services/serverDataSyncService'
import { attendeeInfoService } from '../services/attendeeInfoService'
import { dataClearingService } from '../services/dataClearingService'
import type { Attendee } from '../types/attendee'
import Footer from '../components/common/Footer'

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean
  attendee: Attendee | null
  isLoading: boolean
  isSigningOut: boolean
  
  // Easy access to attendee name information
  attendeeName: { first_name: string; last_name: string; full_name: string } | null
  
  // Authentication methods
  login: (accessCode: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<{ success: boolean; error?: string }>
  
  // Status methods
  checkAuthStatus: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [attendee, setAttendee] = useState<Attendee | null>(null)
  const [attendeeName, setAttendeeName] = useState<{ first_name: string; last_name: string; full_name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  
  // Track active login process to abort if logout is called during login
  const loginAbortControllerRef = useRef<AbortController | null>(null)

  // Function to clear all cached data on authentication failure
  const clearCachedData = useCallback(() => {
    try {
      // Clear all confidential keys from localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith('kn_cache_') || // Our cached data
          key.startsWith('kn_cached_') || // Session data
          key.startsWith('kn_sync_') || // Sync status
          key.startsWith('kn_conflicts') || // Conflicts
          key.startsWith('sb-') || // Supabase auth tokens
          key.includes('supabase') // Any other Supabase keys
        )) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      // Clear authentication state
      localStorage.removeItem('conference_auth')
    } catch (error) {
      console.warn('⚠️ Error clearing cached data:', error)
    }
  }, [])


  const checkAuthStatus = useCallback(async () => {
    try {
      const authStatus = getAuthStatus()
      setIsAuthenticated(authStatus.isAuthenticated)
      // Note: authStatus.attendee might be SanitizedAttendee, but we'll handle it in the context
      setAttendee(authStatus.attendee as Attendee | null)
      
      // Load attendee name from cache if available
      const cachedName = await attendeeInfoService.getAttendeeName()
      setAttendeeName(cachedName)
    } catch (error) {
      console.warn('⚠️ Error checking auth status, using defaults:', error)
      setIsAuthenticated(false)
      setAttendee(null)
      setAttendeeName(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check authentication status on mount - only if not already authenticated
  useEffect(() => {
    // Only check auth status if we don't already have it
    // This prevents race conditions with login state updates
    if (!isAuthenticated) {
      checkAuthStatus()
    }
  }, [isAuthenticated, checkAuthStatus])

  const login = async (accessCode: string): Promise<{ success: boolean; error?: string }> => {
    // Create abort controller for this login attempt
    const abortController = new AbortController()
    loginAbortControllerRef.current = abortController
    
    try {
      console.log('🔄 Starting authentication process...')
      
      // Step 1: Authenticate with the auth service FIRST (validate access code)
      console.log('🔐 Step 1: Authenticating with access code...')
      const authResult = await authenticateWithAccessCode(accessCode)
      
      // ✅ CHECK: If logout was called during auth, abort here
      if (abortController.signal.aborted) {
        console.log('⏸️ Login aborted - logout was called during authentication')
        return { success: false, error: 'Login cancelled' }
      }
      
      // Step 2: Only proceed with data sync if authentication is successful
      if (!authResult.success || !authResult.attendee) {
        console.log('❌ Authentication failed, no data will be synced')
        // Clear any cached data to prevent data leakage
        clearCachedData()
        return {
          success: false,
          error: authResult.error || 'Authentication failed'
        }
      }
      
      // Step 3: Authentication successful, proceed with data sync
      
      // ✅ CHECK: Final abort check before setting state
      if (abortController.signal.aborted) {
        console.log('⏸️ Login aborted - not setting authentication state')
        return { success: false, error: 'Login cancelled' }
      }
      
      // Set authentication state (we already validated authResult.success above)
      console.log('🔄 Setting authentication state to true...')
      setIsAuthenticated(true)
      setAttendee(authResult.attendee)
      
      // Step 3: Single coordinated sync after authentication
      console.log('🔄 Step 3: Starting coordinated authentication sync...')
      let syncResult: { success: boolean; error?: string } = { success: false }
      
      try {
        if (abortController.signal.aborted) {
          console.log('⏸️ Login aborted - skipping authentication sync')
          return { success: false, error: 'Login cancelled' }
        }
        
        const { AuthenticationSyncService } = await import('../services/authenticationSyncService')
        const authSyncService = AuthenticationSyncService.getInstance()
        syncResult = await authSyncService.syncAfterAuthentication()
        
        if (!syncResult.success) {
          console.warn('⚠️ Authentication sync failed:', syncResult.error)
          // Continue with login even if sync fails - user can still use app
        } else {
          console.log('✅ Authentication sync completed successfully')
        }
        
      } catch (syncError) {
        console.warn('⚠️ Authentication sync failed:', syncError)
        // Continue with login even if sync fails
        syncResult = { success: false, error: syncError instanceof Error ? syncError.message : 'Unknown sync error' }
      }
      
      // Load attendee name from the newly cached info
      const cachedName = await attendeeInfoService.getAttendeeName()
      setAttendeeName(cachedName)
      
      console.log('✅ Authentication successful!')
      console.log('👤 Attendee identified:', `${authResult.attendee.first_name} ${authResult.attendee.last_name}`)
      if (syncResult?.success) {
        console.log('📊 Data synced for offline use')
      } else {
        console.log('⚠️ Using basic authentication (offline data may be limited)')
      }
      console.log('👤 Attendee name cached for easy access:', cachedName?.full_name)

      // Navigate to home page after successful authentication
      // Use setTimeout to ensure state update completes before navigation
      setTimeout(() => {
        // Use window.location for navigation to work in all contexts
        // Check if window is available (not in test environment)
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
          window.location.href = '/'
        }
      }, 100)

      return { success: true }
    } catch (error) {
      console.warn('⚠️ Authentication error, using fallback:', error)
      // Clear any cached data to prevent data leakage
      clearCachedData()
      setIsAuthenticated(false)
      setAttendee(null)
      setAttendeeName(null)
      return { 
        success: false, 
        error: 'Authentication failed. Please try again or contact support.' 
      }
    } finally {
      // Clear the abort controller reference
      if (loginAbortControllerRef.current === abortController) {
        loginAbortControllerRef.current = null
      }
    }
  }

  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    if (isSigningOut) {
      console.log('⏳ Sign-out already in progress')
      return { success: false, error: 'Sign-out already in progress' }
    }

    setIsSigningOut(true)
    
    // ✅ CRITICAL: Abort any in-flight login process
    if (loginAbortControllerRef.current) {
      console.log('🛑 Aborting in-flight login process...')
      loginAbortControllerRef.current.abort()
      loginAbortControllerRef.current = null
    }
    
    try {
      console.log('🔄 Starting comprehensive sign-out process...')
      
      // Step 1: Clear all cached data
      console.log('🗑️ Step 1: Clearing all cached data...')
      const clearResult = await dataClearingService.clearAllData()
      
      if (!clearResult.success) {
        console.warn('⚠️ Data clearing had issues:', clearResult.errors)
        // Return failure if data clearing failed
        return { 
          success: false, 
          error: `Data clearing failed: ${clearResult.errors.join(', ')}` 
        }
      }

      // ✅ NEW: Clear attendee sync service state
      try {
        const { attendeeSyncService } = await import('../services/attendeeSyncService')
        attendeeSyncService.clearSyncState()
        console.log('🧹 Attendee sync state cleared')
      } catch (attendeeError) {
        console.warn('⚠️ Failed to clear attendee sync state:', attendeeError)
      }
      
      // Step 2: Clear authentication state
      console.log('🔐 Step 2: Clearing authentication state...')
      await authSignOut()
      
      // Step 3: Ensure cache is completely clean after logout
      console.log('🧹 Step 3: Ensuring complete cache cleanup...')
      try {
        // Clear any remaining cache entries
        const remainingCacheKeys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('kn_cache_')) {
            remainingCacheKeys.push(key)
          }
        }
        
        if (remainingCacheKeys.length > 0) {
          console.log(`🧹 Logout: Clearing ${remainingCacheKeys.length} remaining cache entries`)
          remainingCacheKeys.forEach(key => localStorage.removeItem(key))
        }
        
        console.log('✅ Logout: Cache completely clean')
      } catch (error) {
        console.warn('⚠️ Logout: Cache cleanup failed:', error)
      }
      
      // Step 4: Update React state
      console.log('⚛️ Step 4: Updating React state...')
      setIsAuthenticated(false)
      setAttendee(null)
      setAttendeeName(null)
      
      // Step 5: Verify data clearing
      console.log('✅ Step 5: Verifying data clearing...')
      const verificationResult = await dataClearingService.verifyDataCleared()
      
      if (!verificationResult) {
        console.warn('⚠️ Data clearing verification failed - some data may remain')
        return { 
          success: false, 
          error: 'Data clearing verification failed - some data may remain' 
        }
      }
      
      // Sign-out completed
      console.log(`📊 Performance: ${clearResult.performanceMetrics.duration.toFixed(2)}ms`)
      
      return { success: true }
      
    } catch (error) {
      console.warn('⚠️ Sign-out error, clearing auth state anyway:', error)
      
      // Even if data clearing failed, still clear authentication state
      console.log('🔐 Clearing authentication state despite data clearing failure...')
      await authSignOut()
      setIsAuthenticated(false)
      setAttendee(null)
      setAttendeeName(null)
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign-out failed' 
      }
    } finally {
      // Only update state if React is still available (not during test teardown)
      try {
        setIsSigningOut(false)
      } catch (error) {
        // Ignore errors during test teardown or when React is not available
        console.warn('Failed to update signing out state:', error)
      }
    }
  }

  const value: AuthContextType = {
    isAuthenticated,
    attendee,
    attendeeName,
    isLoading,
    isSigningOut,
    login,
    logout,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Default export for Fast Refresh compatibility
export default useAuth

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth()
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    }
    
    if (!isAuthenticated) {
      return <LoginPage />
    }
    
    return <Component {...props} />
  }
}

// Login page component
export const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')
  const [showError, setShowError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Focus preservation: Keep input focused during background re-renders
  const inputRef = useRef<HTMLInputElement>(null)

  // Clean Cache Architecture: Ensure clean cache state when login page renders
  useEffect(() => {
    const ensureCleanCache = () => {
      try {
        console.log('🧹 LoginPage: Ensuring clean cache state...')
        
        // Clear ALL cache entries to ensure clean state
        const cacheKeys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (
            key.startsWith('kn_cache_') ||     // Our cached data
            key.startsWith('kn_cached_') ||    // Session data
            key.startsWith('kn_sync_') ||      // Sync status
            key.startsWith('kn_conflicts') ||    // Conflicts
            key.startsWith('sb-') ||           // Supabase auth tokens
            key.includes('supabase')           // Any other Supabase keys
          )) {
            cacheKeys.push(key)
          }
        }
        
        if (cacheKeys.length > 0) {
          console.log(`🧹 LoginPage: Clearing ${cacheKeys.length} cache entries for clean state`)
          cacheKeys.forEach(key => localStorage.removeItem(key))
          console.log('✅ LoginPage: Cache is now clean - ready for fresh authentication')
        } else {
          console.log('✅ LoginPage: Cache already clean')
        }
        
        // Clear any authentication state
        localStorage.removeItem('conference_auth')
        
      } catch (error) {
        console.warn('⚠️ LoginPage: Failed to ensure clean cache:', error)
      }
    }
    
    // Run once when login page mounts
    ensureCleanCache()
  }, []) // Empty dependency array - run only once on mount

  const handleSubmit = useCallback(async (e?: React.FormEvent, codeToSubmit?: string) => {
    if (e) e.preventDefault()
    setError('')
    setShowError(false)
    
    const codeToUse = codeToSubmit || accessCode
    if (!codeToUse.trim()) {
      setError('Please enter your access code')
      setShowError(true)
      return
    }

    try {
      const result = await login(codeToUse.trim())
      
      if (!result.success) {
        setError('Invalid access code. Please try again or ask at the registration desk for help.')
        setShowError(true)
      }
    } catch (error) {
      setError('Invalid access code. Please try again or ask at the registration desk for help.')
      setShowError(true)
    } finally {
      setIsLoading(false)
    }
  }, [accessCode, login])

  // Auto-submit when 6th character is entered
  useEffect(() => {
    if (accessCode.length === 6 && !isLoading) {
      // Show loading state first
      setIsLoading(true)
      
      // Store the code before clearing
      const codeToSubmit = accessCode
      
      // Clear the field after a brief delay to show loading
      timeoutRef.current = setTimeout(() => {
        setAccessCode('')
        handleSubmit(undefined, codeToSubmit)
      }, 500) // 500ms delay to show loading state
    }
  }, [accessCode, handleSubmit, isLoading])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Auto-login from URL parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const codeParam = searchParams.get('code')
    
    if (codeParam && !autoLoginAttempted && !isLoading) {
      setAutoLoginAttempted(true)
      setIsLoading(true)
      
      // SECURITY: Clear URL parameter immediately (prevent sharing)
      searchParams.delete('code')
      navigate({ search: searchParams.toString() }, { replace: true })
      
      // Auto-submit login (reuses existing handleSubmit)
      handleSubmit(undefined, codeParam)
    }
  }, [location.search, autoLoginAttempted, isLoading, navigate, handleSubmit])

  // Focus preservation: Restore focus after re-renders (e.g., from background cache operations)
  useEffect(() => {
    // If input exists, has value, and isn't disabled, keep it focused
    if (inputRef.current && accessCode.length > 0 && !isLoading) {
      inputRef.current.focus()
    }
  }) // Run after every render to catch focus loss immediately

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: translateY(-50%) rotate(0deg); }
            100% { transform: translateY(-50%) rotate(360deg); }
          }
        `}
      </style>
      <div className="main-content" style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F5F6F7 0%, #F2ECFB 100%)',
        padding: 'var(--space-xl) var(--space-lg) 120px',
        position: 'relative',
        overflow: 'hidden'
      }}>
      {/* Soft Background Imagery */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 30%, rgba(124, 76, 196, 0.15) 0%, transparent 60%),
          radial-gradient(circle at 80% 70%, rgba(148, 104, 206, 0.12) 0%, transparent 60%),
          radial-gradient(circle at 40% 80%, rgba(196, 168, 232, 0.10) 0%, transparent 60%),
          radial-gradient(circle at 60% 20%, rgba(124, 76, 196, 0.08) 0%, transparent 50%)
        `,
        zIndex: 1
      }} />
      
      {/* Subtle Pattern Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(124, 76, 196, 0.2) 1px, transparent 0)
        `,
        backgroundSize: '25px 25px',
        opacity: 0.4,
        zIndex: 2
      }} />
      
      {/* Additional Soft Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '10%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(148, 104, 206, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 1
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '15%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(196, 168, 232, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 1
      }} />
      <div className="card" style={{ 
        maxWidth: '400px', 
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
        marginTop: 'var(--space-lg)',
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid rgba(124, 76, 196, 0.1)',
        boxShadow: '0 8px 32px rgba(124, 76, 196, 0.1), 0 4px 16px rgba(0, 0, 0, 0.05)'
      }}>
        <div className="mb-lg">
          <img 
            src="/Apax logos_RGB_Apax_RGB.png" 
            alt="Apax Logo" 
            style={{ 
              width: '160px',
              height: 'auto',
              margin: '0 auto var(--space-xl)',
              display: 'block'
            }}
          />
          <h1 className="logo" style={{ 
            fontSize: 'var(--text-4xl)', 
            marginBottom: 'var(--space-xl)',
            textAlign: 'center'
          }}>
            KnowledgeNow 2025
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} style={{ marginTop: 'var(--space-xl)' }}>
          <div className="mb-lg">
            <label htmlFor="accessCode" style={{ 
              display: 'block',
              fontSize: 'var(--text-sm)',
              color: 'var(--ink-700)',
              marginBottom: 'var(--space-sm)',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              {autoLoginAttempted && isLoading 
                ? 'Logging you in...' 
                : 'Enter your 6-character access code'}
            </label>
            
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                id="accessCode"
                name="accessCode"
                type="text"
                required
                className="form-input"
                placeholder=""
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase())
                  // Clear error when user starts typing
                  if (showError) {
                    setShowError(false)
                    setError('')
                  }
                }}
                maxLength={6}
                disabled={isLoading}
                autoFocus
                style={{
                  textAlign: 'center',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  letterSpacing: '0.5em',
                  textTransform: 'uppercase',
                  fontFamily: 'monospace',
                  padding: 'var(--space-md)',
                  border: '2px solid var(--ink-300)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--white)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  opacity: isLoading ? 0.7 : 1
                }}
              />
              {isLoading && (
                <div 
                  data-testid="loading-spinner"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: 'var(--space-md)',
                    transform: 'translateY(-50%)',
                    width: '24px',
                    height: '24px',
                    border: '3px solid var(--ink-200)',
                    borderTop: '3px solid var(--purple-500)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} 
                />
              )}
            </div>
          </div>

          {showError && error && (
            <div className="mb-lg" style={{ 
              color: 'var(--red-500)', 
              fontSize: 'var(--text-sm)',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
        </form>
        
        <div style={{ 
          color: 'var(--ink-500)', 
          fontSize: '0.75rem',
          textAlign: 'center'
        }}>
          <p className="mb-sm">Ask registration for help if you can not find your access code</p>
        </div>
      </div>
      
      <Footer transparent />
    </div>
    </>
  )
}

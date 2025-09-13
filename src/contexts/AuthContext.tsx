/**
 * Authentication Context for Access Code-based Authentication
 * 
 * Provides authentication state and methods throughout the app.
 * All data access requires authentication - no public data is available.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { 
  authenticateWithAccessCode, 
  signOut as authSignOut,
  getAuthStatus 
} from '../services/authService'
import type { Attendee } from '../types/attendee'

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean
  attendee: Attendee | null
  isLoading: boolean
  
  // Authentication methods
  login: (accessCode: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  
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
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = () => {
    try {
      const authStatus = getAuthStatus()
      setIsAuthenticated(authStatus.isAuthenticated)
      setAttendee(authStatus.attendee)
    } catch (error) {
      console.error('❌ Error checking auth status:', error)
      setIsAuthenticated(false)
      setAttendee(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (accessCode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await authenticateWithAccessCode(accessCode)
      
      if (result.success && result.attendee) {
        setIsAuthenticated(true)
        setAttendee(result.attendee)
        return { success: true }
      } else {
        setIsAuthenticated(false)
        setAttendee(null)
        return { success: false, error: 'Invalid access code. Please try again or ask at the registration desk for help.' }
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      setIsAuthenticated(false)
      setAttendee(null)
      return { 
        success: false, 
        error: 'Invalid access code. Please try again or ask at the registration desk for help.' 
      }
    }
  }

  const logout = () => {
    try {
      authSignOut()
      setIsAuthenticated(false)
      setAttendee(null)
    } catch (error) {
      console.error('❌ Logout error:', error)
    }
  }

  const value: AuthContextType = {
    isAuthenticated,
    attendee,
    isLoading,
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
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')
  const [showError, setShowError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError('')
    setShowError(false)
    
    if (!accessCode.trim()) {
      setError('Please enter your access code')
      setShowError(true)
      return
    }

    try {
      const result = await login(accessCode.trim())
      
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
      
      // Clear the field after a brief delay to show loading
      setTimeout(() => {
        setAccessCode('')
        handleSubmit()
      }, 500) // 500ms delay to show loading state
    }
  }, [accessCode, handleSubmit, isLoading])

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
        padding: 'var(--space-xl) var(--space-lg) var(--space-lg)',
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
              Enter your 6-character access code
            </label>
            <div style={{ position: 'relative' }}>
              <input
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
    </div>
    </>
  )
}

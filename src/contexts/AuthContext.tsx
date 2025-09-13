/**
 * Authentication Context for Access Code-based Authentication
 * 
 * Provides authentication state and methods throughout the app.
 * All data access requires authentication - no public data is available.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
      setIsLoading(true)
      
      const result = await authenticateWithAccessCode(accessCode)
      
      if (result.success && result.attendee) {
        setIsAuthenticated(true)
        setAttendee(result.attendee)
        return { success: true }
      } else {
        setIsAuthenticated(false)
        setAttendee(null)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      setIsAuthenticated(false)
      setAttendee(null)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }
    } finally {
      setIsLoading(false)
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
const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth()
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!accessCode.trim()) {
      setError('Please enter your access code')
      return
    }

    const result = await login(accessCode.trim())
    if (!result.success) {
      setError(result.error || 'Invalid access code')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Conference Companion
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your access code to continue
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="accessCode" className="sr-only">
              Access Code
            </label>
            <input
              id="accessCode"
              name="accessCode"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your 6-character access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
        
        <div className="text-center text-xs text-gray-500">
          <p>Your access code is 6 alphanumeric characters</p>
          <p>Contact support if you need assistance</p>
        </div>
      </div>
    </div>
  )
}

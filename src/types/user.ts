// TypeScript interfaces for User Profiles based on actual database schema
// Generated from real database data via authenticated Supabase API

export type UserRole = 'admin' | 'user' | 'guest'

export interface UserProfile {
  // Primary fields (auto-generated)
  id: string
  created_at: string
  updated_at: string
  
  // User Details (Actual database fields)
  user_id: string             // Reference to Supabase auth user
  role: UserRole              // User role (admin, user, guest)
  email: string               // User email address
  first_name: string          // First name
  last_name: string           // Last name
  
  // Status
  is_active: boolean          // Active status
}

// Form data interface for creating/editing user profiles
export interface UserProfileFormData {
  user_id: string
  role: UserRole
  email: string
  first_name: string
  last_name: string
  is_active: boolean
}

// API response types
export interface UserProfileResponse {
  data: UserProfile[]
  error?: string
}

export interface CreateUserProfileRequest {
  user_id: string
  role: UserRole
  email: string
  first_name: string
  last_name: string
  is_active?: boolean
}

export interface UpdateUserProfileRequest extends CreateUserProfileRequest {
  id: string
}

// Helper functions
export const getFullName = (user: UserProfile): string => {
  return `${user.first_name} ${user.last_name}`
}

export const isAdmin = (user: UserProfile): boolean => {
  return user.role === 'admin'
}

export const isActive = (user: UserProfile): boolean => {
  return user.is_active
}

// Constants for dropdown options
export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'user', label: 'User' },
  { value: 'guest', label: 'Guest' }
]

// Utility types for display
export interface UserProfileDisplay extends UserProfile {
  full_name: string
  role_display: string
  status_display: string
}

// Helper function to create display version
export const createUserProfileDisplay = (user: UserProfile): UserProfileDisplay => {
  const roleDisplay = USER_ROLES.find(role => role.value === user.role)?.label || user.role
  
  return {
    ...user,
    full_name: getFullName(user),
    role_display: roleDisplay,
    status_display: user.is_active ? 'Active' : 'Inactive'
  }
}

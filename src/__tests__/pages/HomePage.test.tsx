/**
 * HomePage Component Tests
 * Tests the main dashboard page functionality
 */

import { render, screen } from '../utils/test-utils'
import HomePage from '../../pages/HomePage'

describe('HomePage', () => {
  test('renders without crashing', () => {
    render(<HomePage />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  test('displays Now & Next section', () => {
    render(<HomePage />)
    expect(screen.getByText('Now & Next')).toBeInTheDocument()
  })

  test('displays current session', () => {
    render(<HomePage />)
    expect(screen.getByText('Networking Coffee Break')).toBeInTheDocument()
  })

  test('displays next session', () => {
    render(<HomePage />)
    expect(screen.getByText('Track A: Revenue Growth Strategies')).toBeInTheDocument()
  })

  test('has proper accessibility structure', () => {
    render(<HomePage />)
    
    // Check for main content area
    expect(screen.getByRole('main')).toBeInTheDocument()
    
    // Check for navigation
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    
    // Check for headings
    expect(screen.getByRole('heading', { name: 'Now & Next' })).toBeInTheDocument()
  })
})

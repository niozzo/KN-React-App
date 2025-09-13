/**
 * Simple Component Test
 * Basic test to verify testing infrastructure works
 */

import { render, screen } from '../utils/test-utils'

// Simple test component
const TestComponent = () => {
  return <div data-testid="test-component">Hello World</div>
}

describe('SimpleComponent', () => {
  test('renders without crashing', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('test-component')).toBeInTheDocument()
  })

  test('displays correct text', () => {
    render(<TestComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})

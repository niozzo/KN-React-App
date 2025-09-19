import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasscodeScreen } from '../components/PasscodeScreen';

describe('PasscodeScreen', () => {
  const mockOnPasscodeValid = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render passcode form', () => {
    render(<PasscodeScreen onPasscodeValid={mockOnPasscodeValid} />);
    
    expect(screen.getByText('Admin Access')).toBeInTheDocument();
    expect(screen.getByLabelText('Passcode')).toBeInTheDocument();
    expect(screen.getByText('Access Admin Panel')).toBeInTheDocument();
  });
});

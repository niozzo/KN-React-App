import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ConferenceEndedCard from '../../components/ConferenceEndedCard';

// Mock window.open
const mockOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ConferenceEndedCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders conference ended message', () => {
    renderWithRouter(<ConferenceEndedCard />);
    
    expect(screen.getByText('🎉 See you next year!')).toBeInTheDocument();
    expect(screen.getByText('Thank you for participating in Apax KnowledgeNow 2025. We hope you had a great experience!')).toBeInTheDocument();
    expect(screen.getByText('📝 Share Feedback')).toBeInTheDocument();
    expect(screen.getByText('View Past Sessions')).toBeInTheDocument();
  });

  it('opens survey link when feedback button is clicked', () => {
    renderWithRouter(<ConferenceEndedCard />);
    
    const feedbackButton = screen.getByText('📝 Share Feedback');
    fireEvent.click(feedbackButton);
    
    expect(mockOpen).toHaveBeenCalledWith('https://forms.gle/survey-feedback-link', '_blank');
  });


  it('calls custom handlers when provided', () => {
    const mockFeedbackClick = vi.fn();
    
    renderWithRouter(
      <ConferenceEndedCard 
        onFeedbackClick={mockFeedbackClick}
      />
    );
    
    fireEvent.click(screen.getByText('📝 Share Feedback'));
    
    expect(mockFeedbackClick).toHaveBeenCalled();
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it('applies custom className and style', () => {
    const customStyle = { backgroundColor: 'red' };
    const { container } = renderWithRouter(
      <ConferenceEndedCard 
        className="custom-class"
        style={customStyle}
      />
    );
    
    const card = container.querySelector('.conference-ended-card');
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveStyle('background-color: red');
  });
});

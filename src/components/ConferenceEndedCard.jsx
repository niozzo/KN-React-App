import React from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { useNavigate } from 'react-router-dom';

/**
 * Conference Ended Card Component
 * Displays when all conference sessions have finished
 */
const ConferenceEndedCard = ({ 
  className = '',
  style = {},
  onFeedbackClick,
  onViewSessionsClick 
}) => {
  const navigate = useNavigate();

  const handleFeedbackClick = () => {
    if (onFeedbackClick) {
      onFeedbackClick();
    } else {
      // Default behavior - open survey link
      const surveyUrl = import.meta.env.VITE_SURVEY_FEEDBACK_URL || 
        'https://forms.gle/survey-feedback-link';
      window.open(surveyUrl, '_blank');
    }
  };

  const handleViewSessionsClick = () => {
    if (onViewSessionsClick) {
      onViewSessionsClick();
    } else {
      // Default behavior - navigate to schedule
      navigate('/schedule');
    }
  };

  return (
    <Card 
      className={`conference-ended-card ${className}`} 
      style={{
        background: 'var(--green-50)',
        border: '2px solid var(--green-200)',
        textAlign: 'center',
        padding: 'var(--space-xl)',
        gridColumn: '1 / -1',
        ...style
      }}
    >
      <div className="conference-ended-content">
        <h3 style={{ 
          color: 'var(--green-700)', 
          marginBottom: 'var(--space-sm)',
          fontSize: 'var(--text-xl)'
        }}>
          🎉 See you next year!
        </h3>
        <p style={{ 
          color: 'var(--green-600)',
          fontSize: 'var(--text-base)',
          marginBottom: 'var(--space-lg)',
          maxWidth: '400px',
          margin: '0 auto var(--space-lg) auto'
        }}>
          Thank you for participating in Apax KnowledgeNow 2025. We hope you had a great experience!
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
          <Button 
            variant="primary"
            onClick={handleFeedbackClick}
          >
            📝 Share Feedback
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ConferenceEndedCard;

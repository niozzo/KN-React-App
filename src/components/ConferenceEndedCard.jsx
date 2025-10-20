import React from 'react';
import PropTypes from 'prop-types';
import Card from './common/Card';

/**
 * Conference Ended Card Component
 * Displays when all conference sessions have finished
 */
const ConferenceEndedCard = React.memo(({ 
  className = '',
  style = {}
}) => {

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
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.className === nextProps.className &&
    prevProps.style === nextProps.style
  );
});

ConferenceEndedCard.propTypes = {
  className: PropTypes.string,
  style: PropTypes.object
};

ConferenceEndedCard.defaultProps = {
  className: '',
  style: {}
};

export default ConferenceEndedCard;

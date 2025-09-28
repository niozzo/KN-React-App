import React from 'react';
import PropTypes from 'prop-types';

/**
 * SessionErrorBoundary Component
 * Catches rendering errors in session components and provides graceful fallback
 * Story 2.6: Fix Speaker Object Rendering Error
 */
class SessionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorId: `session-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('🚨 SessionErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      sessionData: this.props.sessionData ? {
        id: this.props.sessionData.id,
        title: this.props.sessionData.title,
        speaker: this.props.sessionData.speaker,
        speakerInfo: this.props.sessionData.speakerInfo,
        speakers: this.props.sessionData.speakers
      } : null,
      timestamp: new Date().toISOString()
    });

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Log to external monitoring service if available
    if (window.gtag) {
      window.gtag('event', 'session_rendering_error', {
        error_message: error.message,
        error_id: this.state.errorId,
        session_id: this.props.sessionData?.id || 'unknown'
      });
    }
  }

  handleRetry = () => {
    // Reset error state to allow retry
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI for when there's an error
      return (
        <div 
          className="session-error-fallback"
          style={{
            padding: 'var(--space-md)',
            margin: 'var(--space-sm)',
            background: 'var(--red-50)',
            border: '1px solid var(--red-200)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--red-700)'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: 'var(--space-sm)' 
          }}>
            <span style={{ 
              fontSize: '1.2rem', 
              marginRight: 'var(--space-xs)' 
            }}>
              ⚠️
            </span>
            <h4 style={{ 
              margin: 0, 
              fontSize: 'var(--text-base)',
              fontWeight: '600'
            }}>
              Session Display Issue
            </h4>
          </div>
          
          <p style={{ 
            margin: '0 0 var(--space-sm) 0',
            fontSize: 'var(--text-sm)',
            color: 'var(--red-600)'
          }}>
            There was a problem displaying this session. The session information may be incomplete.
          </p>

          {this.props.sessionData && (
            <div style={{ 
              marginBottom: 'var(--space-sm)',
              fontSize: 'var(--text-sm)',
              color: 'var(--red-600)'
            }}>
              <strong>Session:</strong> {this.props.sessionData.title || 'Unknown'}
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-sm)',
            alignItems: 'center'
          }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: 'var(--space-xs) var(--space-sm)',
                background: 'var(--red-600)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: '500'
              }}
            >
              Try Again
            </button>
            
            {this.props.onError && (
              <button
                onClick={() => this.props.onError(this.state.error, this.state.errorInfo)}
                style={{
                  padding: 'var(--space-xs) var(--space-sm)',
                  background: 'transparent',
                  color: 'var(--red-600)',
                  border: '1px solid var(--red-300)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)'
                }}
              >
                Report Issue
              </button>
            )}
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details style={{ 
              marginTop: 'var(--space-sm)',
              fontSize: 'var(--text-xs)',
              color: 'var(--red-500)'
            }}>
              <summary style={{ cursor: 'pointer' }}>
                Debug Information
              </summary>
              <pre style={{ 
                marginTop: 'var(--space-xs)',
                padding: 'var(--space-xs)',
                background: 'var(--red-100)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'auto',
                fontSize: '10px'
              }}>
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

SessionErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  sessionData: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    speaker: PropTypes.any,
    speakerInfo: PropTypes.string,
    speakers: PropTypes.array
  }),
  onError: PropTypes.func
};

SessionErrorBoundary.defaultProps = {
  sessionData: null,
  onError: null
};

export default SessionErrorBoundary;

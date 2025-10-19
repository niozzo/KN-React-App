import React, { useRef, useEffect } from 'react';
import { usePullToRefresh, PullToRefreshOptions } from '../../hooks/usePullToRefresh';

/**
 * PullToRefresh Component
 * Pure UI component that uses usePullToRefresh hook
 * Follows our component architecture patterns
 */
interface PullToRefreshProps extends PullToRefreshOptions {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  className = '',
  style = {},
  ...hookOptions
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    isPulling,
    isRefreshing,
    pullDistance,
    canPull,
    pullProgress,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = usePullToRefresh(hookOptions);

  // Set up event listeners on document to capture all touch events
  useEffect(() => {
    // Add touch event listeners to document to capture all touch events
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate stroke-dashoffset for circular progress
  const circumference = 100.53; // 2 * PI * 16 (radius)
  const strokeDashoffset = circumference * (1 - pullProgress);

  return (
    <div 
      ref={containerRef}
      className={`pull-to-refresh-container ${className}`}
      style={{
        position: 'relative',
        ...style
      }}
    >
      {/* Pull indicator - positioned at top of content area */}
      {(isPulling || isRefreshing) && (
        <div
          className="pull-indicator"
          style={{
            position: 'sticky',
            top: 0,
            left: 0,
            right: 0,
            height: '80px',
            background: 'linear-gradient(135deg, var(--purple-50) 0%, var(--purple-100) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            borderBottom: '1px solid var(--purple-200)',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)',
            marginBottom: '0'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--purple-700)',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle
                cx="20" cy="20" r="16"
                fill="none"
                stroke="var(--purple-200)"
                strokeWidth="3"
              />
              <circle
                cx="20" cy="20" r="16"
                fill="none"
                stroke="var(--purple-600)"
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 20 20)"
                style={{ 
                  transition: isRefreshing ? 'none' : 'stroke-dashoffset 0.1s ease',
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                }}
              />
            </svg>
            {!isRefreshing && (
              <span>
                {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: isPulling ? `translateY(${Math.max(0, pullDistance - 80)}px)` : 'none',
          transition: isRefreshing ? 'transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
          position: 'relative'
        }}
      >
        {children}
      </div>

      {/* CSS for spin animation */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PullToRefresh;

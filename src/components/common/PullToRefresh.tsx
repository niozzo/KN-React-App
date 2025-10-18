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
  
  // Debug logging
  console.log('PullToRefresh component received:', {
    hookOptions,
    hasOnRefresh: !!hookOptions.onRefresh,
    onRefreshType: typeof hookOptions.onRefresh
  });
  
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

  // Calculate rotation for refresh icon
  const iconRotation = pullProgress * 360;

  return (
    <div 
      ref={containerRef}
      className={`pull-to-refresh-container ${className}`}
      style={{
        position: 'relative',
        ...style
      }}
    >
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="pull-indicator"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: `${Math.min(pullDistance, 80)}px`,
            background: 'linear-gradient(135deg, var(--purple-50) 0%, var(--purple-100) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: isRefreshing ? 'height 0.3s ease' : 'none',
            borderBottom: '1px solid var(--purple-200)',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)'
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
            <div
              style={{
                width: '24px',
                height: '24px',
                border: '2px solid var(--purple-300)',
                borderTop: '2px solid var(--purple-600)',
                borderRadius: '50%',
                transform: `rotate(${iconRotation}deg)`,
                transition: isRefreshing ? 'transform 0.3s ease' : 'none',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }}
            />
            <span>
              {isRefreshing ? 'Refreshing...' : 
               pullProgress >= 1 ? 'Release to refresh' : 
               'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: isPulling ? `translateY(${Math.min(pullDistance, 80)}px)` : 'none',
          transition: isRefreshing ? 'transform 0.3s ease' : 'none'
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

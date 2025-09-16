/**
 * Admin Broadcast Banner Component
 * Displays admin broadcast messages with countdown integration
 * Story 2.1: Now/Next Glance Card - Task 6
 */

import React, { useState, useEffect } from 'react';
import useAdminBroadcasts from '../../hooks/useAdminBroadcasts';

/**
 * Admin Broadcast Banner Component
 */
const AdminBroadcastBanner = ({ 
  className = '',
  onDismiss = null,
  showCountdown = true,
  maxHeight = '120px'
}) => {
  const { activeBroadcast, dismissActiveBroadcast } = useAdminBroadcasts({
    enabled: true,
    checkInterval: 30000
  });

  const [isVisible, setIsVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Calculate time remaining for countdown broadcasts
  useEffect(() => {
    if (!activeBroadcast || !activeBroadcast.expiresAt) {
      setTimeRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const expiresAt = new Date(activeBroadcast.expiresAt);
      const remaining = expiresAt.getTime() - now.getTime();

      if (remaining > 0) {
        setTimeRemaining(remaining);
      } else {
        setTimeRemaining(0);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [activeBroadcast]);

  // Show/hide animation
  useEffect(() => {
    if (activeBroadcast) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [activeBroadcast]);

  // Format countdown time
  const formatCountdown = (milliseconds) => {
    if (milliseconds <= 0) return '0:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get broadcast styling based on type and priority
  const getBroadcastStyles = () => {
    if (!activeBroadcast) return {};

    const baseStyles = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-md)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: 'var(--space-md)',
      maxHeight,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      opacity: isVisible ? 1 : 0
    };

    switch (activeBroadcast.type) {
      case 'urgent':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          color: 'white',
          border: '2px solid #fca5a5',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
        };
      case 'warning':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white',
          border: '2px solid #fbbf24',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        };
      case 'countdown':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: 'white',
          border: '2px solid #a5b4fc',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
        };
      default:
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: 'white',
          border: '2px solid #93c5fd',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        };
    }
  };

  // Get icon based on broadcast type
  const getBroadcastIcon = () => {
    if (!activeBroadcast) return '📢';

    switch (activeBroadcast.type) {
      case 'urgent':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'countdown':
        return '⏰';
      default:
        return '📢';
    }
  };

  const handleDismiss = () => {
    dismissActiveBroadcast();
    if (onDismiss) {
      onDismiss(activeBroadcast);
    }
  };

  if (!activeBroadcast || !isVisible) {
    return null;
  }

  return (
    <div 
      className={`admin-broadcast-banner ${className}`}
      style={getBroadcastStyles()}
      role="alert"
      aria-live="polite"
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <div style={{ 
          fontSize: '1.5rem', 
          marginRight: 'var(--space-sm)',
          flexShrink: 0
        }}>
          {getBroadcastIcon()}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--text-sm)',
            fontWeight: '600',
            marginBottom: 'var(--space-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {activeBroadcast.priority === 'critical' ? 'URGENT' : 
             activeBroadcast.priority === 'high' ? 'IMPORTANT' : 'ANNOUNCEMENT'}
          </div>
          
          <div style={{
            fontSize: 'var(--text-base)',
            lineHeight: '1.4',
            wordBreak: 'break-word'
          }}>
            {activeBroadcast.message}
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--space-sm)',
        flexShrink: 0,
        marginLeft: 'var(--space-sm)'
      }}>
        {showCountdown && timeRemaining !== null && timeRemaining > 0 && (
          <div style={{
            fontSize: 'var(--text-lg)',
            fontWeight: '700',
            fontFamily: 'monospace',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: 'var(--space-xs) var(--space-sm)',
            borderRadius: 'var(--radius-md)',
            minWidth: '60px',
            textAlign: 'center'
          }}>
            {formatCountdown(timeRemaining)}
          </div>
        )}
        
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'white',
            fontSize: 'var(--text-lg)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          aria-label="Dismiss broadcast"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default AdminBroadcastBanner;

/**
 * Time Override Component
 * DEV/STAGING ONLY - Allows setting custom date/time for testing
 * Story 2.1: Now/Next Glance Card - Task 8
 */

import React, { useState, useEffect } from 'react';
import TimeService from '../../services/timeService';

/**
 * Time Override Component
 * Only available in development and staging environments
 */
const TimeOverride = () => {
  // Environment check - only show in dev/staging
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [overrideDateTime, setOverrideDateTime] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load current override state and set defaults
  useEffect(() => {
    const isOverrideActive = TimeService.isOverrideActive();
    setIsActive(isOverrideActive);
    
    if (!isOverrideActive) {
      // Set default values to current date and time
      const now = new Date();
      const dateTimeString = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      setOverrideDateTime(dateTimeString);
    }
  }, []);

  // Update current time every second and trigger events for dynamic override
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      // If dynamic override is active, trigger a time change event
      if (isActive && TimeService.isOverrideActive()) {
        const event = new CustomEvent('timeOverrideChanged', {
          detail: { 
            newTime: TimeService.getCurrentTime(), 
            action: 'dynamicUpdate' 
          }
        });
        window.dispatchEvent(event);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleSetOverride = () => {
    if (overrideDateTime) {
      const overrideDate = new Date(overrideDateTime);
      // Set dynamic override starting at 50 seconds
      TimeService.setDynamicOverrideTime(overrideDate, 50);
      setIsActive(true);
      setIsOpen(false);
      
      // No need to reload - the time will advance automatically
    }
  };

  const handleClearOverride = () => {
    TimeService.clearOverrideTime();
    setIsActive(false);
    setOverrideDateTime('');
    
    // No need to reload - the time will return to real time automatically
  };

  const getCurrentOverrideTime = () => {
    return TimeService.getCurrentTime();
  };

  const getCurrentRealTime = () => {
    return new Date();
  };

  return (
    <div className="time-override-container">
      {/* Toggle Button */}
      <button
        className={`time-override-toggle ${isActive ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Time Override (Dev/Staging Only)"
      >
        🕐 {isActive ? 'Dynamic Override Active' : 'Set Dynamic Override'}
      </button>
      
      {/* Current Time Display */}
      <div className="current-time-display">
        <div className="current-time-value">
          {isActive ? getCurrentOverrideTime().toLocaleString() : currentTime.toLocaleString()}
        </div>
      </div>

      {/* Override Panel */}
      {isOpen && (
        <div className="time-override-panel">
          <div className="time-override-header">
            <h4>Time Override (Dev/Staging Only)</h4>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <div className="time-override-content">
            {isActive ? (
              <div className="override-status">
                <p><strong>Override Active:</strong></p>
                <p>Current Override Time: {getCurrentOverrideTime().toLocaleString()}</p>
                <p>Real Time: {new Date().toLocaleString()}</p>
                <button 
                  className="clear-override-button"
                  onClick={handleClearOverride}
                >
                  Clear Override
                </button>
              </div>
            ) : (
              <div className="override-form">
                <div className="form-group">
                  <label htmlFor="override-datetime">Date & Time (starts at :50 seconds):</label>
                  <input
                    id="override-datetime"
                    type="datetime-local"
                    value={overrideDateTime}
                    onChange={(e) => setOverrideDateTime(e.target.value)}
                  />
                </div>
                
                <div className="form-info">
                  <p>⏱️ Time will start at 50 seconds and advance automatically</p>
                  <p>⏳ You'll only wait 10 seconds to see transitions</p>
                </div>
                
                <button 
                  className="set-override-button"
                  onClick={handleSetOverride}
                  disabled={!overrideDateTime}
                >
                  Start Dynamic Override
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .time-override-container {
          position: fixed;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .time-override-toggle {
          background: rgba(99, 102, 241, 0.8);
          color: rgba(255, 255, 255, 0.9);
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .time-override-toggle:hover {
          background: rgba(79, 70, 229, 0.9);
          color: rgba(255, 255, 255, 1);
        }

        .time-override-toggle.active {
          background: rgba(220, 38, 38, 0.8);
          color: rgba(255, 255, 255, 0.9);
        }

        .time-override-toggle.active:hover {
          background: rgba(185, 28, 28, 0.9);
          color: rgba(255, 255, 255, 1);
        }

        .current-time-display {
          background: rgba(0, 0, 0, 0.6);
          color: rgba(255, 255, 255, 0.8);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          text-align: center;
          min-width: 200px;
        }

        .current-time-label {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .current-time-value {
          font-family: 'Courier New', monospace;
          font-size: 9px;
        }

        .time-override-panel {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          min-width: 300px;
          margin-top: 8px;
        }

        .time-override-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .time-override-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #6b7280;
        }

        .time-override-content {
          padding: 16px;
        }

        .form-group {
          margin-bottom: 12px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-info {
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 4px;
          margin-bottom: 12px;
        }

        .form-info p {
          margin: 0 0 4px 0;
          font-size: 11px;
          color: #6b7280;
        }

        .form-info p:last-child {
          margin-bottom: 0;
        }

        .set-override-button,
        .clear-override-button {
          width: 100%;
          padding: 8px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .set-override-button:hover,
        .clear-override-button:hover {
          background: #4f46e5;
        }

        .set-override-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .clear-override-button {
          background: #dc2626;
        }

        .clear-override-button:hover {
          background: #b91c1c;
        }

        .override-status p {
          margin: 0 0 8px 0;
          font-size: 12px;
        }

        .override-status p:first-child {
          font-weight: 600;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
};

export default TimeOverride;

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
    
    if (isOverrideActive) {
      // Load existing override start time for editing
      const startTime = TimeService.getOverrideStartTime();
      if (startTime) {
        // Convert to datetime-local format (YYYY-MM-DDTHH:MM)
        const dateTimeString = startTime.toISOString().slice(0, 16);
        setOverrideDateTime(dateTimeString);
      }
    } else {
      // Set default values to current date and time
      const now = new Date();
      const dateTimeString = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      setOverrideDateTime(dateTimeString);
    }
  }, []);

  // Update current time every second - use TimeService for consistent time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(TimeService.getCurrentTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleSetOverride = () => {
    if (overrideDateTime) {
      const overrideDate = new Date(overrideDateTime);
      // Set seconds to 50 and use our updated TimeService
      overrideDate.setSeconds(50);
      TimeService.setOverrideTime(overrideDate);
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


  return (
    <div className="time-override-container">
      {/* Toggle Button */}
      <button
        className={`time-override-toggle ${isActive ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Time Override (Dev/Staging Only)"
      >
        🕐 {isActive ? 'Edit Dynamic Override' : 'Set Dynamic Override'}
      </button>
      
      {/* Current Time Display */}
      <div className="current-time-display">
        <div className="current-time-value">
          {currentTime.toLocaleString()}
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
                <p>Current Override Time: {currentTime.toLocaleString()}</p>
                <p>Real Time: {new Date().toLocaleString()}</p>
                
                <div className="override-actions">
                  <button 
                    className="edit-override-button"
                    onClick={() => {
                      // Load current start time for editing
                      const startTime = TimeService.getOverrideStartTime();
                      if (startTime) {
                        const dateTimeString = startTime.toISOString().slice(0, 16);
                        setOverrideDateTime(dateTimeString);
                      }
                      // Switch to edit mode by setting isActive to false temporarily
                      setIsActive(false);
                    }}
                  >
                    Edit Override
                  </button>
                  
                  <button 
                    className="clear-override-button"
                    onClick={handleClearOverride}
                  >
                    Clear Override
                  </button>
                </div>
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
                
                <div className="form-actions">
                  <button 
                    className="set-override-button"
                    onClick={handleSetOverride}
                    disabled={!overrideDateTime}
                  >
                    {TimeService.isOverrideActive() ? 'Update Override' : 'Start Dynamic Override'}
                  </button>
                  
                  <button 
                    className="cancel-override-button"
                    onClick={() => {
                      setIsOpen(false);
                      // Reset to current time if canceling
                      const now = new Date();
                      const dateTimeString = now.toISOString().slice(0, 16);
                      setOverrideDateTime(dateTimeString);
                    }}
                  >
                    Cancel
                  </button>
                </div>
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
          opacity: 0.8;
          transition: opacity 0.3s ease;
        }

        .time-override-container:hover {
          opacity: 1;
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
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          text-align: center;
          min-width: 200px;
          backdrop-filter: blur(5px);
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
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(229, 231, 235, 0.8);
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

        .override-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .override-actions button {
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .edit-override-button {
          background: #6366f1;
          color: white;
        }

        .edit-override-button:hover {
          background: #4f46e5;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .form-actions button {
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .cancel-override-button {
          background: #6b7280;
          color: white;
        }

        .cancel-override-button:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default TimeOverride;

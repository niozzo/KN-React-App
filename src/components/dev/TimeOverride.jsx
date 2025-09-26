/**
 * Time Override Component
 * Available in all environments - Allows setting custom date/time for testing
 * Story 2.1: Now/Next Glance Card - Task 8
 */

import React, { useState, useEffect } from 'react';
import TimeService from '../../services/timeService';
import { ValidationRules } from '../../utils/validationUtils';

/**
 * Time Override Component
 * Available in all environments for testing
 */
const TimeOverride = () => {
  // Show in all environments for testing
  // if (process.env.NODE_ENV === 'production') {
  //   return null;
  // }

  const [isOpen, setIsOpen] = useState(false);
  const [overrideDateTime, setOverrideDateTime] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [validationError, setValidationError] = useState('');
  const [lastEnteredTime, setLastEnteredTime] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Load current override state and set defaults
  useEffect(() => {
    const isOverrideActive = TimeService.isOverrideActive();
    setIsActive(isOverrideActive);
    
    if (isOverrideActive) {
      // Load existing override time for editing
      const overrideTime = TimeService.getOverrideTime();
      if (overrideTime) {
        // Convert to datetime-local format (YYYY-MM-DDTHH:MM)
        const dateTimeString = overrideTime.toISOString().slice(0, 16);
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

  // Validate datetime input
  const validateDateTime = (value) => {
    const result = ValidationRules.dateTimeLocal(value, 'Date & Time');
    setValidationError(result.isValid ? '' : result.message);
    return result.isValid;
  };

  const handleDateTimeChange = (e) => {
    const value = e.target.value;
    setOverrideDateTime(value);
    setValidationError(''); // Clear previous errors
    
    // Real-time validation
    if (value) {
      validateDateTime(value);
    }
  };

  const handleSetOverride = () => {
    if (overrideDateTime) {
      // Validate before setting
      if (!validateDateTime(overrideDateTime)) {
        return;
      }
      
      const overrideDate = new Date(overrideDateTime);
      
      // Additional validation for reasonable date range
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (overrideDate < oneYearAgo || overrideDate > oneYearFromNow) {
        setValidationError('Date must be within the last year or next year');
        return;
      }
      
      // Store the last entered time for editing
      setLastEnteredTime(overrideDateTime);
      
      TimeService.setDynamicOverrideTime(overrideDate);
      setIsActive(true);
      setIsEditMode(false); // Reset edit mode when setting override
      setIsOpen(false);
      setValidationError('');
    }
  };

  const handleClearOverride = () => {
    TimeService.clearOverrideTime();
    setIsActive(false);
    setOverrideDateTime('');
    setLastEnteredTime(''); // Clear the last entered time
    setIsEditMode(false); // Reset edit mode
    setIsOpen(false); // Close the panel when override is cleared
    
    // No need to reload - the time will return to real time automatically
  };


  return (
    <div className="time-override-container">
      {/* Toggle Button */}
      <button
        className={`time-override-toggle ${isActive ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Time Override (Testing Tool)"
      >
        🕐 {isActive ? 'Edit Dynamic Override' : 'Set Dynamic Override'}
      </button>
      
      {/* Current Time Display */}
      <div className="current-time-display" data-testid="current-time-display">
        <div className="current-time-value">
          {currentTime.toLocaleString()}
        </div>
      </div>

      {/* Override Panel */}
      {isOpen && (
        <div className="time-override-panel">
          <div className="time-override-header">
            <h4>Time Override (Testing Tool)</h4>
            <button 
              className="close-button"
              onClick={() => {
                setIsOpen(false);
                setIsEditMode(false); // Reset edit mode when closing
              }}
            >
              ×
            </button>
          </div>

          <div className="time-override-content">
            {isActive && !isEditMode ? (
              <div className="override-status">
                <p><strong>Override Active:</strong></p>
                <p>Current Override Time: {currentTime.toLocaleString()}</p>
                <p>Real Time: {new Date().toLocaleString()}</p>
                
                <div className="override-actions">
                  <button 
                    className="edit-override-button"
                    onClick={() => {
                      // Switch to edit mode
                      setIsEditMode(true);
                      
                      // Load the last entered time for editing
                      if (lastEnteredTime) {
                        setOverrideDateTime(lastEnteredTime);
                      } else {
                        // Fallback: try to get the original start time and adjust it back
                        const overrideStartTime = TimeService.getOverrideStartTime();
                        if (overrideStartTime) {
                          // Adjust back to the original time (remove the :50 seconds adjustment)
                          const originalTime = new Date(overrideStartTime);
                          originalTime.setSeconds(0); // Reset to :00 seconds
                          const dateTimeString = originalTime.toISOString().slice(0, 16);
                          setOverrideDateTime(dateTimeString);
                        }
                      }
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
                    onChange={handleDateTimeChange}
                    className={validationError ? 'error' : ''}
                    required
                  />
                  {validationError && (
                    <div className="error-message" style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
                      {validationError}
                    </div>
                  )}
                </div>
                
                <div className="form-info">
                  <p>⏱️ Time will start at 50 seconds and advance automatically</p>
                  <p>⏳ You'll only wait 10 seconds to see transitions</p>
                </div>
                
                <div className="form-actions">
                  <button 
                    className="set-override-button"
                    onClick={handleSetOverride}
                    disabled={!overrideDateTime || !!validationError}
                  >
                    {isEditMode ? 'Update Override' : 'Start Dynamic Override'}
                  </button>
                  
                  <button 
                    className="cancel-override-button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsEditMode(false); // Reset edit mode
                      // Reset to current time if canceling
                      const now = new Date();
                      const dateTimeString = now.toISOString().slice(0, 16);
                      setOverrideDateTime(dateTimeString);
                      setLastEnteredTime(''); // Clear the last entered time
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

        .time-override-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          cursor: pointer;
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
          position: fixed;
          top: 20vh;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 1);
          border: 1px solid #d1d5db;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          width: 320px;
          max-width: 90vw;
          max-height: 60vh;
          z-index: 1001;
          overflow-y: auto;
        }

        /* Responsive adjustments for mobile devices */
        @media (max-width: 480px) {
          .time-override-panel {
            left: 50%;
            top: 10vh;
            transform: translateX(-50%);
            width: calc(100vw - 20px);
            max-width: 320px;
            max-height: 80vh;
          }
        }

        .time-override-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
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
          padding: 12px 16px;
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
          box-sizing: border-box;
        }

        /* Responsive datetime input */
        @media (max-width: 768px) {
          .form-group input[type="datetime-local"] {
            font-size: 16px; /* Prevents zoom on iOS */
            padding: 12px 8px;
          }
        }

        .form-group input.error {
          border-color: #dc2626;
          box-shadow: 0 0 0 1px #dc2626;
        }

        .error-message {
          color: #dc2626;
          font-size: 12px;
          margin-top: 4px;
        }

        .form-info {
          background: #f3f4f6;
          padding: 6px 10px;
          border-radius: 4px;
          margin-bottom: 10px;
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

        /* Responsive button styling */
        @media (max-width: 768px) {
          .set-override-button,
          .clear-override-button {
            padding: 12px 8px;
            font-size: 16px;
            min-height: 44px; /* Touch-friendly minimum size */
          }
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

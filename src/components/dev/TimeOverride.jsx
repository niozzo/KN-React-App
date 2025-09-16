/**
 * Time Override Component
 * DEV/STAGING ONLY - Allows setting custom date/time for testing
 * Story 2.1: Now/Next Glance Card - Task 8
 */

import React, { useState, useEffect } from 'react';

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
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideTime, setOverrideTime] = useState('');
  const [isActive, setIsActive] = useState(false);

  // Load current override state
  useEffect(() => {
    const storedOverride = localStorage.getItem('kn_time_override');
    if (storedOverride) {
      const overrideDate = new Date(storedOverride);
      setOverrideDate(overrideDate.toISOString().split('T')[0]);
      setOverrideTime(overrideDate.toTimeString().slice(0, 5));
      setIsActive(true);
    }
  }, []);

  const handleSetOverride = () => {
    if (overrideDate && overrideTime) {
      const overrideDateTime = new Date(`${overrideDate}T${overrideTime}`);
      localStorage.setItem('kn_time_override', overrideDateTime.toISOString());
      setIsActive(true);
      setIsOpen(false);
      
      // Trigger a page refresh to apply the override
      window.location.reload();
    }
  };

  const handleClearOverride = () => {
    localStorage.removeItem('kn_time_override');
    setIsActive(false);
    setOverrideDate('');
    setOverrideTime('');
    
    // Trigger a page refresh to clear the override
    window.location.reload();
  };

  const getCurrentOverrideTime = () => {
    const storedOverride = localStorage.getItem('kn_time_override');
    if (storedOverride) {
      const overrideDate = new Date(storedOverride);
      const now = new Date();
      const timeDiff = now.getTime() - new Date(storedOverride).getTime();
      return new Date(overrideDate.getTime() + timeDiff);
    }
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
        🕐 {isActive ? 'Override Active' : 'Set Time Override'}
      </button>

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
                  <label htmlFor="override-date">Date:</label>
                  <input
                    id="override-date"
                    type="date"
                    value={overrideDate}
                    onChange={(e) => setOverrideDate(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="override-time">Time:</label>
                  <input
                    id="override-time"
                    type="time"
                    value={overrideTime}
                    onChange={(e) => setOverrideTime(e.target.value)}
                  />
                </div>
                
                <button 
                  className="set-override-button"
                  onClick={handleSetOverride}
                  disabled={!overrideDate || !overrideTime}
                >
                  Set Override
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .time-override-container {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .time-override-toggle {
          background: #6366f1;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .time-override-toggle:hover {
          background: #4f46e5;
        }

        .time-override-toggle.active {
          background: #dc2626;
        }

        .time-override-toggle.active:hover {
          background: #b91c1c;
        }

        .time-override-panel {
          position: absolute;
          top: 100%;
          right: 0;
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

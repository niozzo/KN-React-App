/**
 * Time Override Panel Component
 * Story 2.2.2: Breakout Session Time Override
 * 
 * Admin interface for updating breakout session times
 */

import React, { useState, useEffect } from 'react';
import { applicationDatabaseService } from '../../services/applicationDatabaseService';

interface TimeOverridePanelProps {
  agendaItemId: string;
  currentStartTime: string;
  currentEndTime: string;
  currentTitle?: string;
  onTimeUpdate?: (startTime: string, endTime: string, enabled: boolean) => void;
  onClose?: () => void;
}

interface TimeOverrideState {
  startTime: string;
  endTime: string;
  enabled: boolean;
  isLoading: boolean;
  error: string;
  hasChanges: boolean;
}

export const TimeOverridePanel: React.FC<TimeOverridePanelProps> = ({
  agendaItemId,
  currentStartTime,
  currentEndTime,
  currentTitle = 'Session',
  onTimeUpdate,
  onClose
}) => {
  console.log('🎛️ TimeOverridePanel rendered with props:', {
    agendaItemId,
    currentStartTime,
    currentEndTime,
    currentTitle,
    startTimeType: typeof currentStartTime,
    endTimeType: typeof currentEndTime
  });
  const [state, setState] = useState<TimeOverrideState>({
    startTime: currentStartTime,
    endTime: currentEndTime,
    enabled: false,
    isLoading: false,
    error: '',
    hasChanges: false
  });

  // Load existing time overrides on mount
  useEffect(() => {
    loadExistingOverrides();
  }, [agendaItemId]);

  const loadExistingOverrides = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: '' }));
      
      const overrides = await applicationDatabaseService.getAgendaItemTimeOverrides();
      const existingOverride = overrides.find(override => override.id === agendaItemId);
      
      if (existingOverride && existingOverride.time_override_enabled) {
        setState(prev => ({
          ...prev,
          startTime: existingOverride.start_time || currentStartTime,
          endTime: existingOverride.end_time || currentEndTime,
          enabled: true,
          isLoading: false
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to load time overrides:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load existing time overrides',
        isLoading: false
      }));
    }
  };

  const validateTimeFormat = (time: string): boolean => {
    // Accept both HH:MM and HH:MM:SS formats
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return timeRegex.test(time);
  };

  const validateTimeRange = (startTime: string, endTime: string): boolean => {
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      return start < end;
    } catch {
      return false;
    }
  };

  const handleStartTimeChange = (value: string) => {
    setState(prev => ({
      ...prev,
      startTime: value,
      hasChanges: true,
      error: ''
    }));
  };

  const handleEndTimeChange = (value: string) => {
    setState(prev => ({
      ...prev,
      endTime: value,
      hasChanges: true,
      error: ''
    }));
  };

  const handleEnabledChange = (enabled: boolean) => {
    setState(prev => ({
      ...prev,
      enabled,
      hasChanges: true,
      error: ''
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!validateTimeFormat(state.startTime)) {
      setState(prev => ({ ...prev, error: 'Invalid start time format (use HH:MM or HH:MM:SS)' }));
      return;
    }

    if (!validateTimeFormat(state.endTime)) {
      setState(prev => ({ ...prev, error: 'Invalid end time format (use HH:MM or HH:MM:SS)' }));
      return;
    }

    if (!validateTimeRange(state.startTime, state.endTime)) {
      setState(prev => ({ ...prev, error: 'End time must be after start time' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: '' }));

      await applicationDatabaseService.updateAgendaItemTimes(
        agendaItemId,
        state.startTime,
        state.endTime,
        state.enabled,
        currentTitle
      );

      setState(prev => ({ ...prev, isLoading: false, hasChanges: false }));

      // Notify parent component
      if (onTimeUpdate) {
        onTimeUpdate(state.startTime, state.endTime, state.enabled);
      }

      // Show success message briefly
      setState(prev => ({ ...prev, error: 'Time override saved successfully!' }));
      setTimeout(() => {
        setState(prev => ({ ...prev, error: '' }));
      }, 2000);

    } catch (error) {
      console.error('Failed to save time override:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to save time override. Please try again.',
        isLoading: false
      }));
    }
  };

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      startTime: currentStartTime,
      endTime: currentEndTime,
      enabled: false,
      hasChanges: false,
      error: ''
    }));
  };

  return (
    <div className="time-override-overlay">
      <div className="time-override-panel">
        <div className="time-override-header">
        <h3>Time Override - {currentTitle}</h3>
        {onClose && (
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      <div className="time-override-content">
        {state.isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Loading...</span>
          </div>
        )}

        <div className="time-comparison">
          <div className="original-times">
            <h4>Original Times</h4>
            <p>Start: {currentStartTime}</p>
            <p>End: {currentEndTime}</p>
          </div>
          
          {state.enabled && (
            <div className="override-times">
              <h4>Override Times</h4>
              <p>Start: {state.startTime}</p>
              <p>End: {state.endTime}</p>
            </div>
          )}
        </div>

        <div className="form-section">
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={state.enabled}
                onChange={(e) => handleEnabledChange(e.target.checked)}
                disabled={state.isLoading}
              />
              Enable time override
            </label>
          </div>

          {state.enabled && (
            <>
              <div className="form-group">
                <label htmlFor="start-time">Start Time</label>
                <input
                  id="start-time"
                  type="time"
                  value={state.startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  disabled={state.isLoading}
                  step="60"
                />
              </div>

              <div className="form-group">
                <label htmlFor="end-time">End Time</label>
                <input
                  id="end-time"
                  type="time"
                  value={state.endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  disabled={state.isLoading}
                  step="60"
                />
              </div>
            </>
          )}
        </div>

        {state.error && (
          <div className={`message ${state.error.includes('successfully') ? 'success' : 'error'}`}>
            {state.error}
          </div>
        )}

        <div className="form-actions">
          <button
            className="save-button"
            onClick={handleSave}
            disabled={state.isLoading || !state.hasChanges}
          >
            {state.isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          
          <button
            className="reset-button"
            onClick={handleReset}
            disabled={state.isLoading}
          >
            Reset
          </button>
        </div>
      </div>

      <style jsx>{`
        .time-override-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .time-override-panel {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .time-override-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 8px 8px 0 0;
        }

        .time-override-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .time-override-content {
          padding: 20px;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: #f3f4f6;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .time-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .time-comparison h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .time-comparison p {
          margin: 4px 0;
          font-size: 14px;
          color: #6b7280;
        }

        .override-times {
          border-left: 3px solid #6366f1;
          padding-left: 12px;
        }

        .form-section {
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          margin: 0;
        }

        .form-group input[type="time"] {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }

        .form-group input[type="time"]:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-group input:disabled {
          background: #f9fafb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .message {
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .message.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .message.success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .form-actions button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .save-button {
          background: #6366f1;
          color: white;
        }

        .save-button:hover:not(:disabled) {
          background: #4f46e5;
        }

        .save-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .reset-button {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .reset-button:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .reset-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .time-comparison {
            grid-template-columns: 1fr;
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .form-actions button {
            width: 100%;
          }
        }
      `}</style>
      </div>
    </div>
  );
};

export default TimeOverridePanel;

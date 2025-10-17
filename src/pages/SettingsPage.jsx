import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { applicationDatabaseService } from '../services/applicationDatabaseService';
// Removed pwaDataSyncService import - using simplified cache approach
import { logger } from '../utils/logger';

/**
 * Settings Page Component
 * Displays user settings with toggle switches and profile information
 * Refactored from settings.html to React component
 */
const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout, isSigningOut, attendee } = useAuth();
  
  // Settings state - simplified to only profile visibility
  const [settings, setSettings] = useState({
    profileVisible: true,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  
  // Sign-out state
  const [signOutError, setSignOutError] = useState('');
  const [showSignOutError, setShowSignOutError] = useState(false);

  // Data refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(null);


  // Load user's actual preference on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!attendee?.id) return;
      try {
        const prefs = await applicationDatabaseService.getAttendeePreferences(attendee.id);
        setSettings(prev => ({ ...prev, profileVisible: prefs.profile_visible }));
      } catch (error) {
        // Expected: User doesn't have preferences row yet
        // Will be created when they toggle a setting for the first time
        if (import.meta.env.DEV) {
          console.log('No preferences found for user, using defaults');
        }
        // Silently use default: profileVisible: true
      }
    };
    loadPreferences();
  }, [attendee?.id]);

  // Handle online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Profile visibility toggle handler
  const handleProfileVisibilityToggle = async () => {
    if (!isOnline || !attendee?.id) return;
    
    setIsSavingPreference(true);
    const newValue = !settings.profileVisible;
    
    try {
      await applicationDatabaseService.updateProfileVisibility(attendee.id, newValue);
      setSettings(prev => ({ ...prev, profileVisible: newValue }));
      localStorage.removeItem('kn_cache_attendees');
    } catch (error) {
      console.error('Failed to update profile visibility:', error);
    } finally {
      setIsSavingPreference(false);
    }
  };

  // Refresh conference data handler
  const handleRefreshData = async (event) => {
    // Remove focus from button to prevent stuck appearance
    if (event?.currentTarget) {
      event.currentTarget.blur();
    }

    if (!isOnline) {
      setRefreshError('You must be online to refresh conference data');
      return;
    }

    setIsRefreshing(true);
    setRefreshSuccess(false);
    setRefreshError('');

    try {
      logger.progress('User-initiated data refresh started', null, 'SettingsPage');
      
      // Step 1: Clear all relevant cache entries to force fresh fetch
      logger.debug('Clearing cache entries to force fresh data fetch', null, 'SettingsPage');
      const cacheKeys = [
        'kn_cache_attendees',
        'kn_cache_agenda_items', 
        'kn_cache_dining_options',
        'kn_cache_hotels',
        'kn_cache_sponsors',
        'kn_cache_seat_assignments',
        'kn_cache_seating_configurations',
        'kn_cached_sessions'
      ];
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
        logger.debug(`Cleared cache: ${key}`, null, 'SettingsPage');
      });
      
      // Step 1.5: Clear AttendeeCacheFilterService cache to ensure fresh profile visibility data
      logger.debug('Clearing AttendeeCacheFilterService cache', null, 'SettingsPage');
      try {
        const { AttendeeCacheFilterService } = await import('../services/attendeeCacheFilterService');
        AttendeeCacheFilterService.clearHiddenProfilesCache();
        logger.debug('AttendeeCacheFilterService cache cleared', null, 'SettingsPage');
      } catch (error) {
        logger.warn('Failed to clear AttendeeCacheFilterService cache', error, 'SettingsPage');
      }
      
      // Step 2: Use simplified sync service
      logger.progress('Force syncing all data from database', null, 'SettingsPage');
      const { serverDataSyncService } = await import('../services/serverDataSyncService');
      const result = await serverDataSyncService.syncAllData();
      
      if (result.success) {
        logger.success('Data refresh successful', null, 'SettingsPage');
        logger.debug(`Synced tables: ${result.syncedTables.join(', ')}`, null, 'SettingsPage');
        setRefreshSuccess(true);
        setLastSyncTime(new Date());
        
        // Clear success message after 3 seconds
        setTimeout(() => setRefreshSuccess(false), 3000);
      } else {
        logger.error('Data refresh failed', result.errors, 'SettingsPage');
        const errorMessage = result.errors.length > 0 
          ? `Failed to refresh data: ${result.errors.join(', ')}`
          : 'Failed to refresh data. Please try again.';
        setRefreshError(errorMessage);
      }
    } catch (error) {
      logger.error('Data refresh error', error, 'SettingsPage');
      const errorMessage = error instanceof Error 
        ? `Failed to refresh data: ${error.message}`
        : 'Failed to refresh data. Please try again.';
      setRefreshError(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  };


  const handleSignOut = async () => {
    logger.debug('Log out clicked', null, 'SettingsPage');
    setSignOutError('');
    setShowSignOutError(false);
    
    try {
      const result = await logout();
      
      if (result.success) {
        logger.success('Logout successful, navigating to login page', null, 'SettingsPage');
        // Navigate to login page after successful logout
        navigate('/login');
      } else {
        logger.error('Logout failed', result.error, 'SettingsPage');
        setSignOutError(result.error || 'Logout failed. Please try again.');
        setShowSignOutError(true);
      }
    } catch (error) {
      logger.error('Logout error', error, 'SettingsPage');
      setSignOutError('Logout failed. Please try again.');
      setShowSignOutError(true);
    }
  };


  // Updated SettingItem component with disabled state support
  const SettingItem = ({ title, description, isEnabled, onChange, disabled, helpText }) => (
    <div className={`setting-item ${disabled ? 'disabled' : ''}`}>
      <div 
        className={`toggle-switch ${isEnabled ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && onChange()}
        style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
      <div className="setting-info">
        <div className="setting-title">{title}</div>
        <div className="setting-description">{description}</div>
        {helpText && <div className="setting-help-text" style={{ fontSize: '12px', color: 'var(--orange-500)', marginTop: '4px' }}>{helpText}</div>}
      </div>
    </div>
  );

  return (
    <PageLayout>
      <h1 className="page-title">Settings</h1>


      {/* Privacy Controls - SIMPLIFIED */}
      <section className="settings-section">
        <div className="section-header">
          <h2 className="section-title">Privacy Controls</h2>
        </div>
        <div className="section-content">
          <SettingItem
            title="Profile Visibility"
            description="Allow your profile to appear in the Bios page"
            isEnabled={settings.profileVisible}
            onChange={handleProfileVisibilityToggle}
            disabled={!isOnline || isSavingPreference}
            helpText={!isOnline ? "Connect to internet to change this setting" : ""}
          />
        </div>
      </section>

      {/* Data & Cache */}
      <section className="settings-section">
        <div className="section-header">
          <h2 className="section-title">Data & Cache</h2>
        </div>
        <div className="section-content">
          <div style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Refresh your schedule, sessions, and dining information to get the latest updates.
          </div>
          {lastSyncTime && (
            <div style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Last refreshed: {lastSyncTime.toLocaleTimeString()}
            </div>
          )}
          <div className="action-buttons">
            <Button 
              variant="secondary"
              onClick={handleRefreshData}
              className="action-button"
              disabled={isRefreshing || !isOnline}
              style={{
                color: isRefreshing ? 'white' : 'var(--purple-700)',
                borderColor: 'var(--purple-700)',
                backgroundColor: isRefreshing ? 'var(--purple-700)' : 'white',
                transition: 'all 0.2s ease'
              }}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Conference Data'}
            </Button>
          </div>
          {refreshSuccess && (
            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--green-50)', borderRadius: '8px', color: 'var(--green-700)' }}>
              ✓ Conference data refreshed successfully!
            </div>
          )}
          {refreshError && (
            <div className="error-message">{refreshError}</div>
          )}
          {!isOnline && (
            <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--orange-500)' }}>
              You must be online to refresh conference data
            </div>
          )}
        </div>
      </section>

      {/* Account - Sign Out */}
      <section className="settings-section">
        <div className="section-header">
          <h2 className="section-title">Account</h2>
        </div>
        <div className="section-content">
          <div className="action-buttons">
            <Button 
              variant="secondary"
              onClick={handleSignOut}
              className="action-button"
              disabled={isSigningOut}
              style={{
                color: 'var(--purple-700)',
                borderColor: 'var(--purple-700)',
                backgroundColor: 'white'
              }}
            >
              {isSigningOut ? 'Logging out...' : 'Log out'}
            </Button>
          </div>
          {showSignOutError && signOutError && (
            <div className="error-message">{signOutError}</div>
          )}
        </div>
      </section>

      {/* Privacy Notice */}
      <div className="privacy-notice">
        <div className="privacy-title">Privacy & Data Protection</div>
        <div className="privacy-text">
          Your privacy is important to us. Contact us for data requests or questions.
        </div>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { applicationDatabaseService } from '../services/applicationDatabaseService';
import { pwaDataSyncService } from '../services/pwaDataSyncService';

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
        console.error('Failed to load preferences:', error);
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
  const handleRefreshData = async () => {
    if (!isOnline) {
      setRefreshError('You must be online to refresh conference data');
      return;
    }

    setIsRefreshing(true);
    setRefreshSuccess(false);
    setRefreshError('');

    try {
      console.log('🔄 User-initiated data refresh started');
      
      // Use existing PWA sync service to refresh all data
      const result = await pwaDataSyncService.syncAllData();
      
      if (result.success) {
        console.log('✅ Data refresh successful');
        setRefreshSuccess(true);
        setLastSyncTime(new Date());
        
        // Clear success message after 3 seconds
        setTimeout(() => setRefreshSuccess(false), 3000);
      } else {
        console.error('❌ Data refresh failed:', result.errors);
        setRefreshError('Failed to refresh data. Please try again.');
      }
    } catch (error) {
      console.error('❌ Data refresh error:', error);
      setRefreshError('Failed to refresh data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };


  const handleSignOut = async () => {
    console.log('🔄 Log out clicked');
    setSignOutError('');
    setShowSignOutError(false);
    
    try {
      const result = await logout();
      
      if (result.success) {
        console.log('✅ Logout successful, navigating to login page');
        // Navigate to login page after successful logout
        navigate('/login');
      } else {
        console.error('❌ Logout failed:', result.error);
        setSignOutError(result.error || 'Logout failed. Please try again.');
        setShowSignOutError(true);
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
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
              variant="primary"
              onClick={handleRefreshData}
              className="action-button"
              disabled={isRefreshing || !isOnline}
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

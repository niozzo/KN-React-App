import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

/**
 * Settings Page Component
 * Displays user settings with toggle switches and profile information
 * Refactored from settings.html to React component
 */
const SettingsPage = () => {
  // Settings state - would come from props or API in real implementation
       const [settings, setSettings] = useState({
         discoverability: true,
         overlapHints: true,
         sessionReminders: true,
         adminBroadcasts: true,
         offlineMode: true
       });


  const handleToggle = (settingKey) => {
    setSettings(prev => ({
      ...prev,
      [settingKey]: !prev[settingKey]
    }));
  };


  const handleSignOut = () => {
    console.log('Sign out clicked');
    // Handle sign out logic
  };


  const SettingItem = ({ settingKey, title, description, isEnabled, onChange }) => (
    <div className="setting-item">
      <div 
        className={`toggle-switch ${isEnabled ? 'active' : ''}`}
        onClick={() => onChange(settingKey)}
      />
      <div className="setting-info">
        <div className="setting-title">{title}</div>
        <div className="setting-description">{description}</div>
      </div>
    </div>
  );

  return (
    <PageLayout>
      <h1 className="page-title">Settings</h1>


      {/* Privacy Controls */}
      <section className="settings-section">
        <div className="section-header">
          <h2 className="section-title">Privacy Controls</h2>
        </div>
        <div className="section-content">
          <SettingItem
            settingKey="discoverability"
            title="Discoverability"
            description="Allow other attendees to find you in search results"
            isEnabled={settings.discoverability}
            onChange={handleToggle}
          />
               <SettingItem
                 settingKey="overlapHints"
                 title="Overlap Hints"
                 description="Allow others to see sessions shared with you"
                 isEnabled={settings.overlapHints}
                 onChange={handleToggle}
               />
        </div>
      </section>

      {/* Notification Settings */}
      <section className="settings-section">
        <div className="section-header">
          <h2 className="section-title">Notifications</h2>
        </div>
        <div className="section-content">
          <SettingItem
            settingKey="sessionReminders"
            title="End of Break Reminders"
            description="Get notified 5 minutes before the end of a break"
            isEnabled={settings.sessionReminders}
            onChange={handleToggle}
          />
          <SettingItem
            settingKey="adminBroadcasts"
            title="Admin Broadcasts"
            description="Receive important conference updates"
            isEnabled={settings.adminBroadcasts}
            onChange={handleToggle}
          />
        </div>
      </section>

      {/* App Settings */}
      <section className="settings-section">
        <div className="section-header">
          <h2 className="section-title">App Settings</h2>
        </div>
        <div className="section-content">
          <SettingItem
            settingKey="offlineMode"
            title="Offline Mode"
            description="Download schedule for offline access"
            isEnabled={settings.offlineMode}
            onChange={handleToggle}
          />
        </div>
      </section>

      {/* Action Buttons */}
      <section className="settings-section">
        <div className="section-content">
          <div className="action-buttons">
            <Button 
              variant="secondary"
              onClick={handleSignOut}
              className="action-button"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </section>

      {/* Privacy Notice */}
      <div className="privacy-notice">
        <div className="privacy-title">Privacy & Data Protection</div>
        <div className="privacy-text">
          Your privacy is important to us. We collect and process your data in accordance with our 
          <a href="#" className="privacy-link"> Privacy Policy</a> and applicable data protection laws. 
          You can manage your data preferences above or contact us for more information.
        </div>
      </div>
    </PageLayout>
  );
};

export default SettingsPage;

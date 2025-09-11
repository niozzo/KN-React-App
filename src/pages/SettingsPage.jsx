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
    contactInformation: true,
    overlapHints: true,
    analyticsParticipation: false,
    sessionReminders: true,
    adminBroadcasts: true,
    emailNotifications: true,
    offlineMode: true,
    autoRefresh: true,
    darkMode: false
  });

  // Profile data - would come from props or API in real implementation
  const profile = {
    name: 'John Doe',
    title: 'Chief Executive Officer',
    company: 'InnovateCorp',
    initials: 'JD'
  };

  const handleToggle = (settingKey) => {
    setSettings(prev => ({
      ...prev,
      [settingKey]: !prev[settingKey]
    }));
  };

  const handleEditProfile = () => {
    console.log('Edit profile clicked');
    // Navigate to profile edit page or open modal
  };

  const handleSignOut = () => {
    console.log('Sign out clicked');
    // Handle sign out logic
  };

  const handleDeleteAccount = () => {
    console.log('Delete account clicked');
    // Handle delete account logic with confirmation
  };

  const SettingItem = ({ settingKey, title, description, isEnabled, onChange }) => (
    <div className="setting-item">
      <div className="setting-info">
        <div className="setting-title">{title}</div>
        <div className="setting-description">{description}</div>
      </div>
      <div 
        className={`toggle-switch ${isEnabled ? 'active' : ''}`}
        onClick={() => onChange(settingKey)}
      />
    </div>
  );

  return (
    <PageLayout>
      <h1 className="page-title">Settings</h1>

      {/* Profile Section */}
      <section className="settings-section">
        <div className="profile-section">
          <div className="profile-avatar">{profile.initials}</div>
          <div className="profile-info">
            <div className="profile-name">{profile.name}</div>
            <div className="profile-title">{profile.title}</div>
            <div className="profile-company">{profile.company}</div>
          </div>
        </div>
      </section>

      {/* Privacy Controls */}
      <section className="settings-section">
        <div className="section-header">
          <h2 className="section-title">Privacy Controls</h2>
          <p className="section-description">Manage your discoverability and data sharing preferences</p>
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
            settingKey="contactInformation"
            title="Contact Information"
            description="Show email and phone in your profile"
            isEnabled={settings.contactInformation}
            onChange={handleToggle}
          />
          <SettingItem
            settingKey="overlapHints"
            title="Overlap Hints"
            description="Show shared sessions and dinner table assignments"
            isEnabled={settings.overlapHints}
            onChange={handleToggle}
          />
          <SettingItem
            settingKey="analyticsParticipation"
            title="Analytics Participation"
            description="Help improve the app with anonymous usage data"
            isEnabled={settings.analyticsParticipation}
            onChange={handleToggle}
          />
        </div>
      </section>

      {/* Notification Settings */}
      <section className="settings-section">
        <div className="section-header">
          <h2 className="section-title">Notifications</h2>
          <p className="section-description">Control how and when you receive notifications</p>
        </div>
        <div className="section-content">
          <SettingItem
            settingKey="sessionReminders"
            title="Session Reminders"
            description="Get notified 15 minutes before your sessions"
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
          <SettingItem
            settingKey="emailNotifications"
            title="Email Notifications"
            description="Receive notifications via email"
            isEnabled={settings.emailNotifications}
            onChange={handleToggle}
          />
        </div>
      </section>

      {/* App Settings */}
      <section className="settings-section">
        <div className="section-header">
          <h2 className="section-title">App Settings</h2>
          <p className="section-description">Customize your app experience</p>
        </div>
        <div className="section-content">
          <SettingItem
            settingKey="offlineMode"
            title="Offline Mode"
            description="Download schedule for offline access"
            isEnabled={settings.offlineMode}
            onChange={handleToggle}
          />
          <SettingItem
            settingKey="autoRefresh"
            title="Auto-refresh"
            description="Automatically update schedule and notifications"
            isEnabled={settings.autoRefresh}
            onChange={handleToggle}
          />
          <SettingItem
            settingKey="darkMode"
            title="Dark Mode"
            description="Use dark theme for better viewing"
            isEnabled={settings.darkMode}
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
              onClick={handleEditProfile}
              className="action-button"
            >
              Edit Profile
            </Button>
            <Button 
              variant="secondary"
              onClick={handleSignOut}
              className="action-button"
            >
              Sign Out
            </Button>
            <Button 
              variant="danger"
              onClick={handleDeleteAccount}
              className="action-button danger"
            >
              Delete Account
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

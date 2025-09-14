import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Header Component
 * Reusable header with logo and user info
 * Now displays real attendee information from AuthContext
 */
const Header = ({ 
  logoText = "KnowledgeNow", 
  onLogoClick,
  onUserClick 
}) => {
  const { isAuthenticated, attendeeName, attendee } = useAuth();

  // Generate initials from attendee name
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Get display name - prefer full name, fallback to first name
  const getDisplayName = () => {
    if (attendeeName?.full_name) {
      return attendeeName.full_name;
    }
    if (attendee?.first_name) {
      return attendee.first_name;
    }
    return 'Guest';
  };

  // Get initials for avatar
  const getAvatarInitials = () => {
    if (attendeeName?.full_name) {
      return getInitials(attendeeName.full_name);
    }
    if (attendee?.first_name && attendee?.last_name) {
      return getInitials(`${attendee.first_name} ${attendee.last_name}`);
    }
    if (attendee?.first_name) {
      return attendee.first_name[0].toUpperCase();
    }
    return '?';
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link 
          to="/" 
          className="logo"
          onClick={onLogoClick}
        >
          {logoText}
        </Link>
        {isAuthenticated && (
          <div 
            className="user-info"
            onClick={onUserClick}
            style={{ cursor: onUserClick ? 'pointer' : 'default' }}
          >
            <div className="user-avatar">
              {getAvatarInitials()}
            </div>
            <span>{getDisplayName()}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

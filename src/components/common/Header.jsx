import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const { isAuthenticated, attendeeName, attendee, logout, isSigningOut } = useAuth();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  // Handle image load error - fall back to initials
  const handleImageError = () => {
    setImageError(true);
  };

  // Reset image error when attendee changes
  React.useEffect(() => {
    setImageError(false);
  }, [attendee?.id]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle logout
  const handleLogout = async () => {
    setIsDropdownOpen(false);
    try {
      const result = await logout();
      if (result.success) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link 
          to="/" 
          className="logo"
          onClick={onLogoClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            maxWidth: 'calc(100vw - 250px)' // Ensure space for user info
          }}
        >
          <img 
            src="/Apax logos_RGB_Apax_RGB.png" 
            alt="Apax" 
            style={{
              width: 'auto',
              display: 'block'
            }}
          />
          <span className="logo-text">
            {logoText}
          </span>
        </Link>
        {isAuthenticated && (
          <>
            <div 
              className="user-info"
              onClick={toggleDropdown}
              style={{ cursor: 'pointer' }}
            >
              <div className="user-avatar">
                {attendee?.photo && !imageError ? (
                  <img
                    src={attendee.photo}
                    alt={`${getDisplayName()} profile picture`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%'
                    }}
                    onError={handleImageError}
                  />
                ) : (
                  getAvatarInitials()
                )}
              </div>
              <span>{getDisplayName()}</span>
            </div>

            {/* Dropdown backdrop - click outside to close */}
            {isDropdownOpen && (
              <div 
                className="profile-dropdown-backdrop"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(false);
                }}
              />
            )}

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="profile-dropdown">
                <button 
                  className="profile-dropdown-item"
                  onClick={handleLogout}
                  disabled={isSigningOut}
                >
                  {isSigningOut ? 'Logging out...' : 'Log out'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Header;

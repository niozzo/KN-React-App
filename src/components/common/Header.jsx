import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Header Component
 * Reusable header with logo and user info
 */
const Header = ({ 
  logoText = "KnowledgeNow", 
  user = { name: "John Doe", initials: "JD" },
  onLogoClick,
  onUserClick 
}) => {
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
        <div className="header-actions">
          <Link 
            to="/index" 
            className="site-map-link"
            style={{
              fontSize: '14px',
              color: 'var(--ink-600)',
              textDecoration: 'none',
              padding: 'var(--space-xs) var(--space-sm)',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
          >
            🗺️ Site Map
          </Link>
          <div 
            className="user-info"
            onClick={onUserClick}
            style={{ cursor: onUserClick ? 'pointer' : 'default' }}
          >
            <div className="user-avatar">
              {user.initials}
            </div>
            <span>{user.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

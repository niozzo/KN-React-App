import React from 'react';

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
        <a 
          href="#" 
          className="logo"
          onClick={(e) => {
            e.preventDefault();
            onLogoClick?.();
          }}
        >
          {logoText}
        </a>
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
    </header>
  );
};

export default Header;

import React from 'react';
import Header from '../common/Header';
import BottomNav from '../common/BottomNav';

/**
 * Page Layout Component
 * Provides consistent layout structure for all pages
 */
const PageLayout = ({
  children,
  user = { name: "John Doe", initials: "JD" },
  onLogoClick,
  onUserClick,
  className = '',
  ...props
}) => {
  return (
    <div className={`page-layout ${className}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} {...props}>
      <Header 
        user={user}
        onLogoClick={onLogoClick}
        onUserClick={onUserClick}
      />
      
      <main className="main-content" data-testid="main-content">
        {children}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default PageLayout;

import React from 'react';
import Header from '../common/Header';
import BottomNav from '../common/BottomNav';

/**
 * Page Layout Component
 * Provides consistent layout structure for all pages
 * Header now gets user info from AuthContext automatically
 */
const PageLayout = ({
  children,
  onLogoClick,
  onUserClick,
  className = '',
  ...props
}) => {
  return (
    <div className={`page-layout ${className}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} {...props}>
      <Header 
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

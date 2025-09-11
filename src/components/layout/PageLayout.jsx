import React from 'react';
import Header from '../common/Header';
import BottomNav from '../common/BottomNav';

/**
 * Page Layout Component
 * Provides consistent layout structure for all pages
 */
const PageLayout = ({
  children,
  activeTab = "home",
  onTabChange,
  user = { name: "John Doe", initials: "JD" },
  onLogoClick,
  onUserClick,
  className = ''
}) => {
  return (
    <div className={`page-layout ${className}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header 
        user={user}
        onLogoClick={onLogoClick}
        onUserClick={onUserClick}
      />
      
      <main className="main-content">
        {children}
      </main>
      
      <BottomNav 
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
};

export default PageLayout;

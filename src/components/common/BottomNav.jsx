import React from 'react';

/**
 * Bottom Navigation Component
 * Fixed bottom navigation with tab-based navigation
 */
const BottomNav = ({ 
  activeTab = "home",
  onTabChange,
  tabs = [
    { id: "home", label: "Home", icon: "🏠", href: "home.html" },
    { id: "schedule", label: "Schedule", icon: "📅", href: "schedule.html" },
    { id: "meet", label: "Meet", icon: "👥", href: "meet.html" },
    { id: "sponsors", label: "Sponsors", icon: "🏢", href: "sponsors.html" },
    { id: "settings", label: "Settings", icon: "⚙️", href: "settings.html" }
  ]
}) => {
  const handleTabClick = (tab, e) => {
    e.preventDefault();
    onTabChange?.(tab.id);
    
    // For now, navigate to the href (will be replaced with React Router later)
    if (tab.href) {
      window.location.href = tab.href;
    }
  };

  return (
    <nav className="bottom-nav">
      <div className="nav-container">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={tab.href}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={(e) => handleTabClick(tab, e)}
          >
            <div className="nav-icon">{tab.icon}</div>
            <div className="nav-label">{tab.label}</div>
          </a>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

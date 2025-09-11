import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Bottom Navigation Component
 * Fixed bottom navigation with tab-based navigation
 */
const BottomNav = ({ 
  tabs = [
    { id: "home", label: "Home", icon: "🏠", path: "/home" },
    { id: "schedule", label: "Schedule", icon: "📅", path: "/schedule" },
    { id: "meet", label: "Meet", icon: "👥", path: "/meet" },
    { id: "sponsors", label: "Sponsors", icon: "🏢", path: "/sponsors" },
    { id: "settings", label: "Settings", icon: "⚙️", path: "/settings" }
  ]
}) => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="nav-container">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.path}
            className={`nav-item ${location.pathname === tab.path ? 'active' : ''}`}
          >
            <div className="nav-icon">{tab.icon}</div>
            <div className="nav-label">{tab.label}</div>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;

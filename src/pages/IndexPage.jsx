import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

/**
 * Index Page Component
 * Site map and landing page for the Conference Companion app
 * Refactored from index.html (507 lines) to ~150 lines
 */
const IndexPage = () => {
  // Page data
  const pages = [
    {
      id: "home",
      title: "Home Screen",
      description: "Main dashboard with Now/Next cards and quick actions",
      icon: "🏠",
      path: "/home",
      url: "home.html"
    },
    {
      id: "schedule",
      title: "Schedule View",
      description: "Personalized agenda with filtering and seat assignments",
      icon: "📅",
      path: "/schedule",
      url: "schedule.html"
    },
    {
      id: "meet",
      title: "Meet List",
      description: "Attendee search and discovery with networking hints",
      icon: "👥",
      path: "/meet",
      url: "meet.html"
    },
    {
      id: "sponsors",
      title: "Sponsor Directory",
      description: "Browse sponsors and discover attendees from each company",
      icon: "🏢",
      path: "/sponsors",
      url: "sponsors.html"
    },
    {
      id: "settings",
      title: "Settings",
      description: "Privacy controls, notifications, and account management",
      icon: "⚙️",
      path: "/settings",
      url: "settings.html"
    },
  ];

  const quickLinks = [
    { id: "home", label: "Home", icon: "🏠", path: "/home" },
    { id: "schedule", label: "Schedule", icon: "📅", path: "/schedule" },
    { id: "meet", label: "Meet List", icon: "👥", path: "/meet" },
    { id: "sponsors", label: "Sponsors", icon: "🏢", path: "/sponsors" },
    { id: "settings", label: "Settings", icon: "⚙️", path: "/settings" },
    { id: "session-detail", label: "Session Detail", icon: "📋", path: "/session-detail" }
  ];

  return (
    <div 
      className="container"
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'var(--space-xl)'
      }}
    >
      {/* Header */}
      <header 
        className="header"
        style={{
          textAlign: 'center',
          marginBottom: 'var(--space-xxl)'
        }}
      >
        <h1 
          className="logo"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '48px',
            fontWeight: '700',
            color: 'var(--purple-700)',
            marginBottom: 'var(--space-md)'
          }}
        >
          Conference Companion
        </h1>
        <p 
          className="subtitle"
          style={{
            fontSize: '22px',
            color: 'var(--ink-700)',
            marginBottom: 'var(--space-lg)'
          }}
        >
          Interactive Mockups & Prototypes
        </p>
        <p 
          className="description"
          style={{
            fontSize: '18px',
            color: 'var(--ink-500)',
            maxWidth: '600px',
            margin: '0 auto var(--space-xl)'
          }}
        >
          Experience the complete Conference Companion PWA through interactive mockups. 
          Start with the Home screen to see the full user experience in action.
        </p>
      </header>

      {/* Main CTA Section */}
      <Card 
        className="main-cta"
        style={{
          background: 'linear-gradient(135deg, var(--purple-700) 0%, var(--purple-500) 100%)',
          borderRadius: '16px',
          padding: 'var(--space-xxl)',
          textAlign: 'center',
          marginBottom: 'var(--space-xxl)',
          boxShadow: '0 8px 32px rgba(124, 76, 196, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div 
          className="cta-content"
          style={{
            position: 'relative',
            zIndex: 1
          }}
        >
          <span 
            className="cta-icon"
            style={{
              fontSize: '64px',
              marginBottom: 'var(--space-lg)',
              display: 'block'
            }}
          >
            🏠
          </span>
          <h2 
            className="cta-title"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '36px',
              fontWeight: '700',
              color: 'var(--white)',
              marginBottom: 'var(--space-md)'
            }}
          >
            Home Screen
          </h2>
          <p 
            className="cta-description"
            style={{
              fontSize: '20px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 'var(--space-xl)',
              maxWidth: '500px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}
          >
            Experience the main dashboard with Now/Next cards, smart countdown timers, 
            seat assignments, and direct access to your full schedule. This is where attendees begin their journey.
          </p>
          <Link 
            to="/home"
            className="cta-button"
            style={{
              display: 'inline-block',
              background: 'var(--white)',
              color: 'var(--purple-700)',
              padding: 'var(--space-lg) var(--space-xxl)',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '20px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            Launch Home Screen →
          </Link>
          <p 
            style={{
              marginTop: 'var(--space-md)',
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontStyle: 'italic'
            }}
          >
            💡 For best results, use a mobile device or resize your browser window
          </p>
          
          <div 
            className="cta-features"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-xl)',
              marginTop: 'var(--space-xl)',
              flexWrap: 'wrap'
            }}
          >
            <div 
              className="cta-feature"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px'
              }}
            >
              <span className="cta-feature-icon" style={{ fontSize: '18px' }}>⚡</span>
              <span>Smart countdowns</span>
            </div>
            <div 
              className="cta-feature"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px'
              }}
            >
              <span className="cta-feature-icon" style={{ fontSize: '18px' }}>📍</span>
              <span>Seat assignments</span>
            </div>
            <div 
              className="cta-feature"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '16px'
              }}
            >
              <span className="cta-feature-icon" style={{ fontSize: '18px' }}>📱</span>
              <span>Mobile responsive</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Site Map Section */}
      <Card 
        className="site-map"
        style={{
          background: 'var(--white)',
          borderRadius: '16px',
          padding: 'var(--space-xxl)',
          boxShadow: '0 4px 16px rgba(14, 24, 33, 0.08)',
          marginBottom: 'var(--space-xxl)'
        }}
      >
        <h2 
          className="site-map-title"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '30px',
            fontWeight: '600',
            color: 'var(--ink-900)',
            marginBottom: 'var(--space-lg)',
            textAlign: 'center'
          }}
        >
          Complete Site Map
        </h2>
        <p 
          className="site-map-description"
          style={{
            fontSize: '18px',
            color: 'var(--ink-700)',
            textAlign: 'center',
            marginBottom: 'var(--space-xl)'
          }}
        >
          Navigate to any mockup page directly. All pages are fully interactive with connected navigation.
        </p>
        
        <div 
          className="pages-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-lg)'
          }}
        >
          {pages.map((page) => (
            <div 
              key={page.id}
              className="page-card"
              style={{
                background: 'var(--gray-100)',
                borderRadius: '12px',
                padding: 'var(--space-lg)',
                transition: 'all 0.2s ease',
                border: '2px solid transparent'
              }}
            >
              <Link 
                to={page.path}
                className="page-link"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block'
                }}
              >
                <div 
                  className="page-icon"
                  style={{
                    fontSize: '26px',
                    marginBottom: 'var(--space-sm)'
                  }}
                >
                  {page.icon}
                </div>
                <h3 
                  className="page-title"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '20px',
                    fontWeight: '600',
                    color: 'var(--ink-900)',
                    marginBottom: 'var(--space-xs)'
                  }}
                >
                  {page.title}
                </h3>
                <p 
                  className="page-description"
                  style={{
                    fontSize: '16px',
                    color: 'var(--ink-700)',
                    marginBottom: 'var(--space-sm)'
                  }}
                >
                  {page.description}
                </p>
                <span 
                  className="page-url"
                  style={{
                    fontSize: '14px',
                    color: 'var(--purple-700)',
                    fontFamily: 'monospace',
                    background: 'var(--white)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}
                >
                  {page.url}
                </span>
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Links */}
      <Card 
        className="quick-links"
        style={{
          background: 'var(--white)',
          borderRadius: '16px',
          padding: 'var(--space-xxl)',
          boxShadow: '0 4px 16px rgba(14, 24, 33, 0.08)'
        }}
      >
        <h2 
          className="quick-links-title"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '26px',
            fontWeight: '600',
            color: 'var(--ink-900)',
            marginBottom: 'var(--space-lg)',
            textAlign: 'center'
          }}
        >
          Quick Navigation
        </h2>
        <div 
          className="links-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-md)'
          }}
        >
          {quickLinks.map((link) => (
            <Link
              key={link.id}
              to={link.path}
              className="quick-link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: 'var(--space-md)',
                background: 'var(--gray-100)',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'var(--ink-700)',
                transition: 'all 0.2s ease',
                fontWeight: '500'
              }}
            >
              <span 
                className="quick-link-icon"
                style={{ fontSize: '20px' }}
              >
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default IndexPage;

import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import { getSponsorsFromStandardizedCompanies } from '../services/dataService';

/**
 * Sponsors Page Component
 * Displays sponsor directory from standardized_companies table
 * Filters by fund_analytics_category === "Sponsors & Vendors"
 */
const SponsorsPage = () => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Load sponsors from standardized companies
  useEffect(() => {
    const loadSponsors = async () => {
      try {
        setLoading(true);
        
        // Fetch sponsors from standardized_companies table
        const sponsorsData = await getSponsorsFromStandardizedCompanies();
        setSponsors(sponsorsData);
        setError(null);
        
        console.log(`✅ Loaded ${sponsorsData.length} sponsors from standardized companies`);
        
      } catch (err) {
        console.error('Error loading sponsors:', err);
        setError('Failed to load sponsors. Please try again.');
        setSponsors([]);
      } finally {
        setLoading(false);
      }
    };

    loadSponsors();
  }, []);

  // Track scroll position for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowBackToTop(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter sponsors based on search term
  const filteredSponsors = useMemo(() => {
    if (!searchTerm.trim()) {
      return sponsors;
    }
    const term = searchTerm.toLowerCase();
    return sponsors.filter(sponsor => 
      sponsor.name && sponsor.name.toLowerCase().includes(term)
    );
  }, [sponsors, searchTerm]);

  // Search event handlers
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleClearSearch = (e) => {
    e.preventDefault();
    setSearchTerm('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Return') {
      e.target.blur();
    }
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle logo loading errors
  const handleLogoError = (e) => {
    e.target.style.display = 'none';
    const fallback = e.target.parentElement?.querySelector('.logo-fallback');
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <h1 className="page-title">Sponsor Directory</h1>
        <div className="loading-state">
          <p>Loading sponsors...</p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <h1 className="page-title">Sponsor Directory</h1>
        <div className="error-state">
          <p>{error}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <h1 className="page-title">Sponsor Directory</h1>

      {/* Search Section */}
      <div
        className="search-container"
        style={{
          background: 'var(--white)',
          padding: 'var(--space-md)',
          borderBottom: '1px solid var(--ink-200)',
          marginBottom: 'var(--space-lg)'
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search sponsors by name..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              fontSize: 'var(--text-lg)',
              padding: 'var(--space-md)',
              paddingRight: searchTerm ? '50px' : 'var(--space-md)',
              border: '2px solid var(--purple-200)',
              borderRadius: 'var(--radius-lg)',
              outline: 'none',
              transition: 'border-color var(--transition-normal), padding-right var(--transition-normal)'
            }}
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color var(--transition-normal)',
                color: 'var(--ink-400)',
                fontSize: '18px',
                zIndex: 10,
                pointerEvents: 'auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--ink-100)';
                e.target.style.color = 'var(--ink-600)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--ink-400)';
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Sponsor Grid */}
      <div className="sponsor-grid">
        {filteredSponsors.map((sponsor) => (
          <Card key={sponsor.id} className="sponsor-card">
            <div className="sponsor-logo-container">
              <img
                src={sponsor.logo}
                alt={`${sponsor.name} logo`}
                onError={handleLogoError}
              />
              <div 
                className="logo-fallback"
                style={{ display: 'none' }}
              >
                {sponsor.name.charAt(0)}
              </div>
            </div>
            
            {/* Make sponsor name a hyperlink */}
            <a 
              href={sponsor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="sponsor-name-link"
            >
              {sponsor.name}
            </a>
            
            {/* Geography badge/label */}
            {sponsor.geography && (
              <div className="sponsor-geography">
                {sponsor.geography}
              </div>
            )}
            
            {/* Description */}
            {sponsor.description && (
              <p className="sponsor-description">
                {sponsor.description}
              </p>
            )}
          </Card>
        ))}
      </div>

      {filteredSponsors.length === 0 && sponsors.length > 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">No sponsors found</h3>
          <p className="empty-description">
            Try adjusting your search term.
          </p>
        </div>
      )}

      {sponsors.length === 0 && (
        <div className="no-results">
          <p>No sponsors available at this time.</p>
        </div>
      )}

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleBackToTop();
          }}
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '60px',
            height: '70px',
            borderRadius: '30px',
            backgroundColor: '#8B5CF6',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            boxShadow: '0 6px 20px rgba(139, 69, 19, 0.3)',
            transition: 'all var(--transition-normal)',
            zIndex: 1000,
            opacity: 1,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
            padding: '8px 4px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 8px 25px rgba(139, 69, 19, 0.4)';
            e.target.style.backgroundColor = '#7C3AED';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 6px 20px rgba(139, 69, 19, 0.3)';
            e.target.style.backgroundColor = '#8B5CF6';
          }}
          title="Back to top"
        >
          <div style={{ fontSize: '18px', marginBottom: '2px' }}>▲</div>
          <div style={{ fontSize: '10px', fontWeight: 'normal' }}>Top</div>
        </button>
      )}
    </PageLayout>
  );
};

export default SponsorsPage;

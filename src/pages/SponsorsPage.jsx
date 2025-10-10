import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import { getAllSponsors } from '../services/dataService';

/**
 * Sponsors Page Component
 * Displays sponsor directory with data from kn_cache_sponsors
 * Refactored from sponsors.html to React component
 */
const SponsorsPage = () => {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load sponsors from cache
  useEffect(() => {
    const loadSponsors = async () => {
      try {
        setLoading(true);
        const sponsorsData = await getAllSponsors();
        setSponsors(sponsorsData);
        setError(null);
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
            <div className="sponsor-name">{sponsor.name}</div>
            <a 
              href={sponsor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="sponsor-website-link"
            >
              Visit Website →
            </a>
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
    </PageLayout>
  );
};

export default SponsorsPage;

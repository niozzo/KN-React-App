import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
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

  const handleVisitWebsite = (url) => {
    window.open(url, '_blank');
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

      {/* Sponsor Grid */}
      <div className="sponsor-grid">
        {sponsors.map((sponsor) => (
          <Card key={sponsor.id} className="sponsor-card">
            <div className="sponsor-logo">
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
            <div className="sponsor-header">
              <div className="sponsor-info">
                <div className="sponsor-name">{sponsor.name}</div>
              </div>
            </div>
            
            <div className="sponsor-actions">
              <Button 
                variant="primary"
                onClick={() => handleVisitWebsite(sponsor.website)}
                className="sponsor-button primary"
              >
                Visit Website
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {sponsors.length === 0 && (
        <div className="no-results">
          <p>No sponsors available at this time.</p>
        </div>
      )}
    </PageLayout>
  );
};

export default SponsorsPage;

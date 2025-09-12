import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

/**
 * Sponsors Page Component
 * Displays sponsor directory with search and filtering
 * Refactored from sponsors.html to React component
 */
const SponsorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - would come from props or API in real implementation
  const sponsorsData = [
    {
      id: 'alvarez-marsal',
      name: 'Alvarez & Marsal',
      category: 'Consulting',
      logo: 'AM',
      description: 'Global professional services firm specializing in turnaround and interim management, performance improvement, and business advisory services.',
      website: 'https://alvarezandmarsal.com'
    },
    {
      id: 'aws',
      name: 'Amazon Web Services',
      category: 'Technology',
      logo: 'AWS',
      description: 'Comprehensive cloud computing platform offering infrastructure, platform, and software services to help businesses scale and grow.',
      website: 'https://aws.amazon.com'
    },
    {
      id: 'vertice',
      name: 'Vertice',
      category: 'Financial Services',
      logo: 'VE',
      description: 'Leading provider of private equity partnerships and investment solutions for institutional investors and family offices.',
      website: 'https://vertice.one'
    },
    {
      id: 'techcorp',
      name: 'TechCorp',
      category: 'Technology',
      logo: 'TC',
      description: 'Innovative technology solutions provider specializing in digital transformation and enterprise software development.',
      website: 'https://techcorp.com'
    },
    {
      id: 'innovatecorp',
      name: 'InnovateCorp',
      category: 'Technology',
      logo: 'IC',
      description: 'Cutting-edge software development company focused on AI and machine learning solutions for enterprise clients.',
      website: 'https://innovatecorp.com'
    },
    {
      id: 'global-finance',
      name: 'Global Finance Partners',
      category: 'Financial Services',
      logo: 'GF',
      description: 'International investment banking firm providing strategic financial advisory services and capital market solutions.',
      website: 'https://globalfinance.com'
    }
  ];

  // Filter sponsors based on search term
  const filteredSponsors = sponsorsData.filter(sponsor =>
    sponsor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sponsor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sponsor.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleVisitWebsite = (url) => {
    window.open(url, '_blank');
  };

  const handleViewSponsor = (sponsor) => {
    // Navigate to meet page or sponsor detail
    console.log('View sponsor:', sponsor);
    // Could navigate to a sponsor detail page or meet page with sponsor filter
  };

  return (
    <PageLayout>
      <h1 className="page-title">Sponsor Directory</h1>

      {/* Search Section */}
      <section className="search-section">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search by company name or service..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </section>

      {/* Sponsor Grid */}
      <div className="sponsor-grid">
        {filteredSponsors.map((sponsor) => (
          <Card key={sponsor.id} className="sponsor-card">
            <div className="sponsor-logo">{sponsor.logo}</div>
            <div className="sponsor-header">
              <div className="sponsor-info">
                <div className="sponsor-name">{sponsor.name}</div>
                <div className="sponsor-category">{sponsor.category}</div>
              </div>
            </div>
            
            <div className="sponsor-description">
              {sponsor.description}
            </div>
            
            <div className="sponsor-actions">
              <Button 
                variant="primary"
                onClick={() => handleViewSponsor(sponsor)}
                className="sponsor-button primary"
              >
                Learn more
              </Button>
              <Button 
                variant="secondary"
                onClick={() => handleVisitWebsite(sponsor.website)}
                className="sponsor-button secondary"
              >
                Visit Website
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredSponsors.length === 0 && (
        <div className="no-results">
          <p>No sponsors found matching your search.</p>
        </div>
      )}
    </PageLayout>
  );
};

export default SponsorsPage;

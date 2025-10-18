import React, { useState, useEffect, useMemo } from 'react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import PullToRefresh from '../components/common/PullToRefresh';
import { getSponsorsFromStandardizedCompanies } from '../services/dataService';
import { offlineAttendeeService } from '../services/offlineAttendeeService';
import { offlineAwareImageService } from '../services/offlineAwareImageService';

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
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [companyAttendees, setCompanyAttendees] = useState({});

  // Load sponsors function - extracted for reuse
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

  // Refresh function for pull-to-refresh
  const handleRefresh = async () => {
    try {
      // Clear sponsor cache to force fresh data
      localStorage.removeItem('kn_cache_sponsors');
      
      // Reload sponsors data
      await loadSponsors();
    } catch (error) {
      console.error('Failed to refresh sponsor data:', error);
    }
  };

  // Load sponsors from standardized companies
  useEffect(() => {
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

  // Fetch company attendees - localStorage-first architecture
  const fetchCompanyAttendees = async (companyName, sponsorId) => {
    try {
      // 🚨 CRITICAL FIX: Check localStorage cache first to prevent cache wiping
      const cachedData = localStorage.getItem('kn_cache_attendees');
      
      if (cachedData) {
        try {
          const cacheObj = JSON.parse(cachedData);
          const attendees = cacheObj.data || cacheObj;
          
          if (Array.isArray(attendees) && attendees.length > 0) {
            // Filter attendees by company and confirmed status directly from cache
            const companyAttendees = attendees.filter(attendee => 
              attendee.company && 
              attendee.company.toLowerCase() === companyName.toLowerCase() &&
              attendee.registration_status === 'confirmed'
            );
            
            // Sort attendees by last name alphabetically
            const sortedAttendees = companyAttendees.sort((a, b) => 
              (a.last_name || '').localeCompare(b.last_name || '')
            );
            
            setCompanyAttendees(prev => ({
              ...prev,
              [sponsorId]: sortedAttendees
            }));
            
            console.log(`✅ Company attendees loaded from cache: ${sortedAttendees.length} attendees`);
            return; // Success - no API call needed
          }
        } catch (cacheError) {
          console.warn('⚠️ Failed to parse cached attendee data:', cacheError);
        }
      }
      
      // 🚨 FALLBACK: Only if no cached data - but don't call service layer to prevent cache wiping
      console.warn('⚠️ No cached attendee data available for company attendees');
      setCompanyAttendees(prev => ({
        ...prev,
        [sponsorId]: []
      }));
      
    } catch (err) {
      console.error('Failed to fetch company attendees:', err);
      setCompanyAttendees(prev => ({
        ...prev,
        [sponsorId]: []
      }));
    }
  };

  // Toggle description expand/collapse
  const toggleDescription = (sponsorId, companyName) => {
    const isCurrentlyExpanded = expandedDescriptions[sponsorId];
    const willBeExpanded = !isCurrentlyExpanded;
    
    setExpandedDescriptions(prev => ({
      ...prev,
      [sponsorId]: willBeExpanded
    }));

    // Fetch attendees when expanding
    if (willBeExpanded && !companyAttendees[sponsorId]) {
      fetchCompanyAttendees(companyName, sponsorId);
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
      <PullToRefresh onRefresh={handleRefresh}>
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
        {filteredSponsors.map((sponsor) => {
          const isExpanded = expandedDescriptions[sponsor.id];
          
          return (
            <Card key={sponsor.id} className="sponsor-card sponsor-card-vertical">
              {/* First row: Name and Geography */}
              <div className="sponsor-info-row">
                {/* Name with external link icon (left-aligned) */}
                <a 
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sponsor-name-link"
                >
                  {sponsor.name}&nbsp;<span className="external-link-icon">⧉</span>
                </a>
                
                {/* Geography badge (right-aligned) */}
                {sponsor.geography && (
                  <div className="sponsor-geography">
                    {sponsor.geography}
                  </div>
                )}
              </div>
              
              {/* Middle: Logo centered */}
              <div className="sponsor-logo-container">
                <img
                  src={offlineAwareImageService.getSponsorLogoUrl(sponsor)}
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
              
              {/* Description section below name */}
              {sponsor.description && (
                <div className="sponsor-description-wrapper">
                  <p className={`sponsor-description ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    {sponsor.description}
                  </p>
                  {!isExpanded && (
                    <button
                      onClick={() => toggleDescription(sponsor.id, sponsor.name)}
                      className="description-toggle-btn"
                      aria-label="Show more"
                    >
                      Show more
                    </button>
                  )}
                </div>
              )}

              {/* Attendees section - only show when expanded */}
              {isExpanded && companyAttendees[sponsor.id] && companyAttendees[sponsor.id].length > 0 && (
                <div style={{ marginTop: 'var(--space-md)' }}>
                  <h4 
                    style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'var(--ink-900)',
                      margin: '0 0 var(--space-sm) 0',
                      textAlign: 'left'
                    }}
                  >
                    Attendees
                  </h4>
                  <ul 
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      textAlign: 'left'
                    }}
                  >
                    {companyAttendees[sponsor.id].map((person) => (
                      <li 
                        key={person.id}
                        style={{
                          marginBottom: 'var(--space-xs)',
                          fontSize: '14px',
                          color: 'var(--ink-700)'
                        }}
                      >
                        <a
                          href={`/bio?id=${person.id}`}
                          style={{
                            color: 'var(--purple-700)',
                            textDecoration: 'none',
                            fontWeight: '500'
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          {person.first_name} {person.last_name}
                        </a>
                        {person.title && (
                          <span style={{ color: 'var(--ink-600)' }}>
                            {' '}• {person.title}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Show less button - only show when expanded and after attendees */}
              {sponsor.description && isExpanded && (
                <button
                  onClick={() => toggleDescription(sponsor.id, sponsor.name)}
                  className="description-toggle-btn"
                  aria-label="Show less"
                  style={{ marginTop: 'var(--space-md)' }}
                >
                  Show less
                </button>
              )}
            </Card>
          );
        })}
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
      </PullToRefresh>
    </PageLayout>
  );
};

export default SponsorsPage;

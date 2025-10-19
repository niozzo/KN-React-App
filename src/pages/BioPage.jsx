import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import PullToRefresh from '../components/common/PullToRefresh';
import { attendeeSearchService } from '../services/attendeeSearchService';
import { CompanyNormalizationService } from '../services/companyNormalizationService';
import { offlineAttendeeService } from '../services/offlineAttendeeService';
import { offlineAwareImageService } from '../services/offlineAwareImageService';

/**
 * Bio Page Component
 * Attendee bio with contact actions and meet list functionality
 * Refactored from bio.html (504 lines) to ~120 lines
 */
const BioPage = () => {
  const [searchParams] = useSearchParams();
  const [attendee, setAttendee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [standardizedCompany, setStandardizedCompany] = useState(null);
  const [companyAttendees, setCompanyAttendees] = useState([]);

  const attendeeId = searchParams.get('id');

  // Enhanced refresh function that follows settings page pattern
  const handleRefresh = async () => {
    try {
      console.log('🔄 [PULL-TO-REFRESH] Starting cache clearing and data refresh');
      
      // Step 1: Clear all relevant cache entries to force fresh fetch (same as settings page)
      const cacheKeys = [
        'kn_cache_attendees',
        'kn_cache_agenda_items', 
        'kn_cache_dining_options',
        'kn_cache_sponsors',
        'kn_cache_seat_assignments',
        'kn_cache_seating_configurations',
        'kn_cached_sessions'
      ];
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 [PULL-TO-REFRESH] Cleared cache: ${key}`);
      });
      
      // Step 2: Use serverDataSyncService.syncAllData() (same as settings page)
      const { serverDataSyncService } = await import('../services/serverDataSyncService');
      const result = await serverDataSyncService.syncAllData();
      
      if (result.success) {
        console.log('✅ [PULL-TO-REFRESH] Data refresh successful');
        console.log(`📊 [PULL-TO-REFRESH] Synced tables: ${result.syncedTables.join(', ')}`);
        
        // Step 3: Reload page to trigger fresh data fetch
        window.location.reload();
      } else {
        console.error('❌ [PULL-TO-REFRESH] Data refresh failed:', result.errors);
        throw new Error(`Failed to refresh data: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ [PULL-TO-REFRESH] Refresh error:', error);
      throw error;
    }
  };

  // Architectural compliance validation
  const validateArchitectureCompliance = () => {
    const hasCache = localStorage.getItem('kn_cache_attendees');
    if (!hasCache) {
      console.warn('⚠️ ARCHITECTURE: No attendee cache found - data should be populated during login');
    }
    return hasCache;
  };

  // Load attendee data based on ID from URL - localStorage-first architecture
  useEffect(() => {
    const loadAttendee = async () => {
      if (!attendeeId) {
        setError('No attendee ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Validate architectural compliance
        validateArchitectureCompliance();
        
        // PRIMARY: Check localStorage first (1000x faster)
        const startTime = performance.now();
        const cachedData = localStorage.getItem('kn_cache_attendees');
        
        if (cachedData) {
          try {
            const cacheObj = JSON.parse(cachedData);
            const attendees = cacheObj.data || cacheObj;
            
            if (Array.isArray(attendees) && attendees.length > 0) {
              const attendee = attendees.find(a => a.id === attendeeId);
              if (attendee) {
                const endTime = performance.now();
                console.log(`📊 BioPage: ${(endTime - startTime).toFixed(2)}ms (localStorage-first)`);
                setAttendee(attendee);
                return; // Success - no API call needed
              }
            }
          } catch (cacheError) {
            console.warn('⚠️ Failed to parse cached attendee data:', cacheError);
          }
        }
        
        // FALLBACK: Only if no cached data or attendee not found
        console.warn('⚠️ No cached attendee data, falling back to service layer');
        
        // 🚨 CRITICAL FIX: Don't call service layer - it triggers API calls that wipe cache
        // Instead, show error message since we can't find attendee in cache
        console.error('❌ CRITICAL: Attendee not found in cache and API fallback disabled to prevent cache wiping');
        setError('Attendee not found in cache. Please refresh the page to reload data.');
        
      } catch (err) {
        console.error('❌ Failed to load attendee:', err);
        setError(err.message || 'Failed to load attendee');
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendee();
  }, [attendeeId]);

  // Load standardized company data when attendee is available
  useEffect(() => {
    const loadStandardizedCompany = async () => {
      if (!attendee || !attendee.company_name_standardized) {
        setStandardizedCompany(null);
        return;
      }

      try {
        const companyService = CompanyNormalizationService.getInstance();
        await companyService.initialize();
        
        // Get standardized company data using the company name
        const companyData = companyService.normalizeCompanyName(attendee.company_name_standardized);
        setStandardizedCompany(companyData);
      } catch (err) {
        console.error('Failed to load standardized company data:', err);
        setStandardizedCompany(null);
      }
    };

    loadStandardizedCompany();
  }, [attendee]);


  const handleBackClick = () => {
    window.history.back();
  };

  // Toggle bio expand/collapse
  const toggleBio = () => {
    setBioExpanded(!bioExpanded);
  };

  // Fetch company attendees when company card is expanded - CACHE-FIRST ONLY
  const fetchCompanyAttendees = async (companyName) => {
    try {
      // 🚨 CRITICAL FIX: Use localStorage-first approach to prevent cache wiping
      const cachedData = localStorage.getItem('kn_cache_attendees');
      
      if (!cachedData) {
        console.warn('⚠️ No cached attendee data for company filtering');
        setCompanyAttendees([]);
        return;
      }
      
      const cacheObj = JSON.parse(cachedData);
      const attendees = cacheObj.data || cacheObj;
      
      if (Array.isArray(attendees) && attendees.length > 0) {
        // Apply company and confirmed status filters directly from cache
        const companyAttendees = attendees.filter(attendee => 
          attendee.company?.toLowerCase() === companyName.toLowerCase() &&
          attendee.registration_status === 'confirmed'
        );
        
        // Ensure current attendee is included in the list
        let allAttendees = companyAttendees;
        
        // Check if current attendee is in the list, if not add them
        if (attendee && !allAttendees.find(att => att.id === attendee.id)) {
          allAttendees = [...allAttendees, attendee];
        }
        
        // Sort by last name alphabetically
        allAttendees = allAttendees.sort((a, b) => 
          (a.last_name || '').localeCompare(b.last_name || '')
        );
        
        setCompanyAttendees(allAttendees);
        console.log(`✅ Company attendees loaded from cache: ${allAttendees.length} attendees`);
      } else {
        console.warn('⚠️ No valid attendee data in cache');
        setCompanyAttendees([]);
      }
    } catch (err) {
      console.error('Failed to fetch company attendees from cache:', err);
      setCompanyAttendees([]);
    }
  };

  // Fetch company attendees when standardized company is available
  useEffect(() => {
    if (standardizedCompany && attendee) {
      fetchCompanyAttendees(standardizedCompany.name);
    }
  }, [standardizedCompany, attendee]);

  // Construct full name from first_name and last_name
  const fullName = attendee ? `${attendee.first_name} ${attendee.last_name}`.trim() : '';

  if (isLoading) {
    return (
      <PageLayout>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading attendee...</p>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={handleBackClick}>Go Back</button>
        </div>
      </PageLayout>
    );
  }

  if (!attendee) {
    return (
      <PageLayout>
        <div className="error-state">
          <p>Attendee not found</p>
          <button onClick={handleBackClick}>Go Back</button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* <PullToRefresh onRefresh={handleRefresh}> */}
        {/* Back Button */}
      <div className="back-link-container" style={{ marginBottom: 'var(--space-sm)' }}>
        <button 
          className="back-link"
          onClick={handleBackClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            color: 'var(--purple-700)',
            fontSize: '16px',
            fontWeight: '500',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
      </div>

      {/* Profile Header */}
      <div 
        className="profile-header"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '6px'
        }}
      >
        <div 
          className="avatar"
          style={{
            maxWidth: '250px',
            maxHeight: '250px',
            width: 'auto',
            height: 'auto',
            background: 'var(--purple-100)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '64px',
            color: 'var(--purple-700)',
            overflow: 'hidden',
            marginBottom: '6px'
          }}
        >
          {attendee.photo ? (
            <img
              src={offlineAwareImageService.getHeadshotUrl(attendee.id, attendee.photo, 250, 250, 85)}
              alt={`${fullName} headshot`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div style={{
            display: attendee.photo ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            👤
          </div>
        </div>
        
        <div className="profile-info" style={{ textAlign: 'center' }}>
          <h1 
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--ink-900)',
              marginBottom: '1px'
            }}
          >
            {fullName}
          </h1>
          <div 
            className="title"
            style={{
              fontSize: '16px',
              color: 'var(--ink-600)',
              marginBottom: '1px'
            }}
          >
            {attendee.title}
          </div>
          <div 
            className="company"
            style={{
              fontSize: '18px',
              color: 'var(--coral)',
              fontWeight: '500',
              marginBottom: '2px'
            }}
          >
            {standardizedCompany ? standardizedCompany.name : attendee.company}
          </div>
          
        </div>
      </div>
      
      {/* Bio Content - Only show if bio exists */}
      {attendee.bio && (
        <Card className="content">
          <div className="section" style={{ marginBottom: '6px' }}>
            <h2 
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--ink-900)',
                margin: '0 0 4px 0'
              }}
            >
              About {fullName}
            </h2>
            <div className="bio-description-wrapper" style={{ paddingBottom: '0px' }}>
              <div 
                className={`bio-text ${bioExpanded ? 'expanded' : 'collapsed'}`}
                style={{
                  color: 'var(--ink-700)',
                  lineHeight: '1.7',
                  whiteSpace: 'pre-line'
                }}
              >
                {attendee.bio}
              </div>
              <button
                onClick={toggleBio}
                className="description-toggle-btn"
                aria-label={bioExpanded ? 'Show less' : 'Show more'}
                style={{
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: 'none',
                  color: 'var(--purple-700)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-medium)',
                  cursor: 'pointer',
                  padding: 'var(--space-xs) 0',
                  transition: 'color var(--transition-normal)',
                  textDecoration: 'underline'
                }}
              >
                {bioExpanded ? 'Show less' : 'Show more'}
              </button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Company Card - Reordered layout */}
      {standardizedCompany && standardizedCompany.name !== 'Apax Partners' && (
        <Card className="sponsor-card sponsor-card-vertical">
          {/* First row: Name and Geography */}
          <div className="sponsor-info-row">
            {/* Name with external link icon (left-aligned) */}
            <a 
              href={standardizedCompany.website}
              target="_blank"
              rel="noopener noreferrer"
              className="sponsor-name-link"
            >
              {standardizedCompany.name}&nbsp;<span className="external-link-icon">⧉</span>
            </a>
            
            {/* Geography badge (right-aligned) - only show for sponsors */}
            {standardizedCompany.geography && standardizedCompany.sector === 'Vendors/Sponsors' && (
              <div className="sponsor-geography">
                {standardizedCompany.geography}
              </div>
            )}
          </div>
          
          {/* Middle: Logo centered */}
          <div className="sponsor-logo-container">
            <img
              src={standardizedCompany.logo}
              alt={`${standardizedCompany.name} logo`}
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div 
              className="logo-fallback"
              style={{ display: 'none' }}
            >
              {standardizedCompany.name.charAt(0)}
            </div>
          </div>
          
          {/* Bottom: Show Sponsor or Sector/Subsector info */}
          {standardizedCompany.sector === 'Vendors/Sponsors' ? (
            <div 
              className="sponsor-label-centered"
              style={{
                fontSize: '16px',
                color: 'var(--ink-600)',
                fontWeight: '400',
                marginBottom: 'var(--space-sm)'
              }}
            >
              Sponsor
            </div>
          ) : standardizedCompany.sector && standardizedCompany.sector !== 'Not Applicable' && standardizedCompany.sector !== 'Vendors/Sponsors' ? (
            <div 
              className="sponsor-label-centered"
              style={{
                fontSize: '16px',
                color: 'var(--ink-600)',
                fontWeight: '400',
                marginBottom: 'var(--space-sm)'
              }}
            >
              {standardizedCompany.sector && standardizedCompany.subsector && standardizedCompany.subsector !== 'Not Applicable' && standardizedCompany.subsector !== 'Vendors/Sponsors' ? (
                `${standardizedCompany.sector} • ${standardizedCompany.subsector}`
              ) : (
                standardizedCompany.sector
              )}
            </div>
          ) : null}
          
          {/* Description section below name */}
          {standardizedCompany.description && (
            <div className="sponsor-description-wrapper">
              <p className="sponsor-description expanded">
                {standardizedCompany.description}
              </p>
            </div>
          )}
          
          {/* Attendees section - always show when attendees exist */}
          {companyAttendees.length > 0 && (
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
                {companyAttendees.map((person) => (
                  <li 
                    key={person.id}
                    style={{
                      marginBottom: 'var(--space-xs)',
                      fontSize: '14px',
                      color: 'var(--ink-700)'
                    }}
                  >
                    {person.id === attendee?.id ? (
                      // Current person - no link, just name and title
                      <span style={{ color: 'var(--ink-700)', fontWeight: 'bold' }}>
                        {person.first_name} {person.last_name}
                        {person.title && (
                          <span style={{ color: 'var(--ink-600)' }}>
                            {' '}• {person.title}
                          </span>
                        )}
                      </span>
                    ) : (
                      // Other attendees - with link
                      <>
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
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
      {/* </PullToRefresh> */}
    </PageLayout>
  );
};

export default BioPage;

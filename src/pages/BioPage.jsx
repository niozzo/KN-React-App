import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import { attendeeSearchService } from '../services/attendeeSearchService';
import { CompanyNormalizationService } from '../services/companyNormalizationService';

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
  const [companyExpanded, setCompanyExpanded] = useState(false);
  const [standardizedCompany, setStandardizedCompany] = useState(null);

  const attendeeId = searchParams.get('id');

  // Load attendee data based on ID from URL
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
        
        // Search for the specific attendee by ID
        const result = await attendeeSearchService.searchAttendees({
          query: '',
          // We'll need to filter by ID in the service or find the attendee
        });
        
        // Find the specific attendee by ID
        const foundAttendee = result.attendees.find(a => a.id === attendeeId);
        
        if (foundAttendee) {
          setAttendee(foundAttendee);
        } else {
          setError('Attendee not found');
        }
        
      } catch (err) {
        console.error('Failed to load attendee:', err);
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

  // Toggle company expand/collapse
  const toggleCompany = () => {
    setCompanyExpanded(!companyExpanded);
  };

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
              src={attendee.photo}
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
      
      {/* Bio Content */}
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
              {attendee.bio || 'No bio available for this attendee.'}
            </div>
            {attendee.bio && (
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
            )}
          </div>
        </div>
      </Card>
      
      {/* Company Card - Exactly like sponsor card */}
      {standardizedCompany && (
        <Card className="sponsor-card sponsor-card-vertical">
          {/* Logo centered on top */}
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
          
          {/* Name and Geography on same line */}
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
            
            {/* Geography badge (right-aligned) */}
            {standardizedCompany.geography && (
              <div className="sponsor-geography">
                {standardizedCompany.geography}
              </div>
            )}
          </div>
          
          {/* Show Sponsor or Sector/Subsector info */}
          {standardizedCompany.sector === 'Vendors/Sponsors' ? (
            <div 
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
              <p className={`sponsor-description ${companyExpanded ? 'expanded' : 'collapsed'}`}>
                {standardizedCompany.description}
              </p>
              <button
                onClick={toggleCompany}
                className="description-toggle-btn"
                aria-label={companyExpanded ? 'Show less' : 'Show more'}
              >
                {companyExpanded ? 'Show less' : 'Show more'}
              </button>
            </div>
          )}
        </Card>
      )}
      
    </PageLayout>
  );
};

export default BioPage;

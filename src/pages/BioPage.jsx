import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusTag from '../components/common/StatusTag';

/**
 * Bio Page Component
 * Attendee bio with contact actions and meet list functionality
 * Refactored from bio.html (504 lines) to ~120 lines
 */
const BioPage = () => {
  const [inMeetList, setInMeetList] = useState(false);

  // Mock data - would come from props or API in real implementation
  const attendee = {
    name: "Sarah Chen",
    title: "Chief Technology Officer",
    company: "TechCorp",
    bio: `Sarah Chen is a visionary technology leader with over 15 years of experience driving digital transformation across Fortune 500 companies. As CTO of TechCorp, she has spearheaded the development of cutting-edge AI and machine learning platforms that have revolutionized how businesses approach data analytics and customer engagement. Her innovative approach to technology strategy has resulted in a 300% increase in operational efficiency and positioned TechCorp as a market leader in enterprise software solutions.

Sarah holds a Ph.D. in Computer Science from Stanford University and has been recognized as one of the "Top 50 Women in Tech" by Forbes. She is passionate about mentoring the next generation of technology leaders and frequently speaks at industry conferences about the future of artificial intelligence and its impact on business transformation. Her leadership philosophy centers on fostering a culture of innovation, collaboration, and continuous learning within her teams.`
  };

  const handleToggleMeetList = () => {
    if (!inMeetList) {
      setInMeetList(true);
    }
    // Note: In the original HTML, once added to meet list, it becomes a tag and can't be removed
  };

  const handleBackClick = () => {
    window.history.back();
  };

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
      <Card 
        className="profile-header"
        style={{
          marginBottom: 'var(--space-lg)'
        }}
      >
        <div 
          className="profile-info-section"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-lg)',
            marginBottom: 'var(--space-lg)'
          }}
        >
          <div 
            className="avatar"
            style={{
              width: '80px',
              height: '80px',
              background: 'var(--purple-100)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'var(--purple-700)'
            }}
          >
            👤
          </div>
          <div className="profile-info" style={{ flex: 1 }}>
            <h1 
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: 'var(--ink-900)',
                marginBottom: '4px'
              }}
            >
              {attendee.name}
            </h1>
            <div 
              className="title"
              style={{
                fontSize: '16px',
                color: 'var(--ink-600)',
                marginBottom: 'var(--space-sm)'
              }}
            >
              {attendee.title}
            </div>
            <div 
              className="company"
              style={{
                fontSize: '18px',
                color: 'var(--coral)',
                fontWeight: '500'
              }}
            >
              {attendee.company}
            </div>
          </div>
        </div>
        
        <div 
          className="contact-actions"
          style={{
            display: 'flex',
            gap: 'var(--space-md)'
          }}
        >
          {inMeetList ? (
            <StatusTag variant="success">
              ✓ In My List
            </StatusTag>
          ) : (
            <Button 
              variant="secondary"
              size="sm"
              onClick={handleToggleMeetList}
              id="meetListBtn"
              style={{
                fontSize: 'var(--text-sm)',
                whiteSpace: 'nowrap'
              }}
            >
              + Add to Meet List
            </Button>
          )}
        </div>
      </Card>
      
      {/* Bio Content */}
      <Card className="content">
        <div className="section" style={{ marginBottom: 'var(--space-xl)' }}>
          <h2 
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--ink-900)',
              marginBottom: 'var(--space-md)',
              paddingBottom: 'var(--space-sm)',
              borderBottom: '2px solid var(--purple-100)'
            }}
          >
            About
          </h2>
          <div 
            className="bio-text"
            style={{
              color: 'var(--ink-700)',
              lineHeight: '1.7',
              whiteSpace: 'pre-line'
            }}
          >
            {attendee.bio}
          </div>
        </div>
      </Card>
      
    </PageLayout>
  );
};

export default BioPage;

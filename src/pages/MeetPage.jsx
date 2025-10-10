import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout';
import AttendeeSearchSection from '../components/search/AttendeeSearchSection';

/**
 * Meet Page Component
 * Attendee search and discovery - simplified to use real data
 */
const MeetPage = () => {
  const navigate = useNavigate();

  const handleAttendeeSelect = (attendee) => {
    navigate(`/bio?id=${attendee.id}`);
  };

  return (
    <PageLayout>
      <h1 className="page-title">Meet List</h1>
      
      <AttendeeSearchSection
        onAttendeeSelect={handleAttendeeSelect}
      />
    </PageLayout>
  );
};

export default MeetPage;

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { PasscodeScreen } from './PasscodeScreen';

// SECURITY NOTE: Admin authentication is separate from user (attendee) authentication
// Admin passcode grants access to management functions and all conference data
// See: ADR-005 (Admin Authentication Pattern) for architectural justification

export const AdminApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated (e.g., from session storage)
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handlePasscodeValid = () => {
    console.log('🔐 Admin authenticated via passcode');
    sessionStorage.setItem('admin_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    console.log('🔓 Admin logged out');
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return <PasscodeScreen onPasscodeValid={handlePasscodeValid} />;
  }

  // Pass onLogout via Outlet context (accessible via useOutletContext in children)
  return <Outlet context={{ onLogout: handleLogout }} />;
};

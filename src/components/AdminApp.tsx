import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { PasscodeScreen } from './PasscodeScreen';

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
    sessionStorage.setItem('admin_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
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

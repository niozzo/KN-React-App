import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import HomePage from './pages/HomePage.jsx'
import MeetPage from './pages/MeetPage.jsx'
import SchedulePage from './pages/SchedulePage.jsx'
import SponsorsPage from './pages/SponsorsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import BioPage from './pages/BioPage.jsx'
import SeatMapPage from './pages/SeatMapPage.jsx'
import OfflineIndicator from './components/OfflineIndicator'
import InstallPrompt from './components/InstallPrompt'
import OfflinePage from './components/OfflinePage'
import { pwaService } from './services/pwaService'
import { AuthProvider, withAuth, LoginPage } from './contexts/AuthContext'
import { AdminApp } from './components/AdminApp'
import { AdminDashboard } from './components/admin/AdminDashboard'
import { QRCodeGenerator } from './components/admin/QRCodeGenerator'
import { SeatingQACheck } from './components/admin/SeatingQACheck'

// Component to handle scroll restoration
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Scroll to top when pathname changes
    // Check if window.scrollTo is available (not in test environment)
    if (typeof window !== 'undefined' && window.scrollTo) {
      window.scrollTo(0, 0)
    }
  }, [pathname])

  return null
}

// Protected route components
const ProtectedHomePage = withAuth(HomePage)
const ProtectedMeetPage = withAuth(MeetPage)
const ProtectedSchedulePage = withAuth(SchedulePage)
const ProtectedSponsorsPage = withAuth(SponsorsPage)
const ProtectedSettingsPage = withAuth(SettingsPage)
const ProtectedBioPage = withAuth(BioPage)
const ProtectedSeatMapPage = withAuth(SeatMapPage)

function App() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Initialize PWA service
    pwaService.checkForUpdates();
  }, []);

  // Smart sync with battery optimization
  useEffect(() => {
    let smartSyncInterval: NodeJS.Timeout | null = null;
    
    // Smart sync: Check for changes every 5 minutes
    // ONLY when page is visible to save battery
    const startSmartSync = () => {
      if (smartSyncInterval) return; // Already running
      
      console.log('Starting smart sync (page visible)');
      
      smartSyncInterval = setInterval(async () => {
        if (isAuthenticated && navigator.onLine && !document.hidden) {
          console.log('Running smart sync check');
          try {
            const { timestampCacheService } = await import('./services/timestampCacheService');
            await timestampCacheService.syncChangedTables();
          } catch (error) {
            console.error('Smart sync failed:', error);
          }
        }
      }, 300000); // 5 minutes
    };
    
    const stopSmartSync = () => {
      if (smartSyncInterval) {
        console.log('Stopping smart sync (page hidden)');
        clearInterval(smartSyncInterval);
        smartSyncInterval = null;
      }
    };
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - stop polling to save battery
        stopSmartSync();
      } else {
        // Page visible - resume polling
        startSmartSync();
        
        // Also do an immediate sync check when page becomes visible
        if (isAuthenticated && navigator.onLine) {
          console.log('Page became visible, checking for changes');
          (async () => {
            try {
              const { timestampCacheService } = await import('./services/timestampCacheService');
              await timestampCacheService.syncChangedTables();
            } catch (error) {
              console.error('Immediate sync check failed:', error);
            }
          })();
        }
      }
    };
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start smart sync if page is currently visible
    if (!document.hidden && isAuthenticated) {
      startSmartSync();
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopSmartSync();
    };
  }, [isAuthenticated]);

  return (
    <AuthProvider>
      <div data-testid="app">
        <ScrollToTop />
        <OfflineIndicator />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedHomePage />} />
          <Route path="/home" element={<ProtectedHomePage />} />
          <Route path="/meet" element={<ProtectedMeetPage />} />
          <Route path="/schedule" element={<ProtectedSchedulePage />} />
          <Route path="/sponsors" element={<ProtectedSponsorsPage />} />
          <Route path="/settings" element={<ProtectedSettingsPage />} />
          <Route path="/bio" element={<ProtectedBioPage />} />
          <Route path="/seat-map" element={<ProtectedSeatMapPage />} />
          <Route path="/admin" element={<AdminApp />}>
            <Route index element={<AdminDashboard />} />
            <Route path="qr-generator" element={<QRCodeGenerator />} />
            <Route path="seating-qa" element={<SeatingQACheck />} />
          </Route>
          <Route path="/offline" element={<OfflinePage />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
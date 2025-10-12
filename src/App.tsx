import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
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
import { AdminPage } from './components/AdminPage'
import { QRCodeGenerator } from './components/admin/QRCodeGenerator'

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
  useEffect(() => {
    // Initialize PWA service
    pwaService.checkForUpdates();
  }, []);

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
            <Route path="manage" element={<AdminPage />} />
            <Route path="qr-generator" element={<QRCodeGenerator />} />
          </Route>
          <Route path="/offline" element={<OfflinePage />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage.jsx'
import MeetPage from './pages/MeetPage.jsx'
import SchedulePage from './pages/SchedulePage.jsx'
import SponsorsPage from './pages/SponsorsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import BioPage from './pages/BioPage.jsx'
import SeatMapPage from './pages/SeatMapPage.jsx'
import IndexPage from './pages/IndexPage.jsx'
import OfflineIndicator from './components/OfflineIndicator'
import InstallPrompt from './components/InstallPrompt'
import OfflinePage from './components/OfflinePage'
import { pwaService } from './services/pwaService'

// Component to handle scroll restoration
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Scroll to top when pathname changes
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  useEffect(() => {
    // Initialize PWA service
    pwaService.checkForUpdates();
  }, []);

  return (
    <>
      <ScrollToTop />
      <OfflineIndicator />
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/meet" element={<MeetPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/sponsors" element={<SponsorsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/bio" element={<BioPage />} />
        <Route path="/seat-map" element={<SeatMapPage />} />
        <Route path="/index" element={<IndexPage />} />
        <Route path="/offline" element={<OfflinePage />} />
      </Routes>
    </>
  )
}

export default App
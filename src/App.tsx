import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import MeetPage from './pages/MeetPage'
import SchedulePage from './pages/SchedulePage'
import SponsorsPage from './pages/SponsorsPage'
import SettingsPage from './pages/SettingsPage'
import BioPage from './pages/BioPage'
import SeatMapPage from './pages/SeatMapPage'
import IndexPage from './pages/IndexPage'

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
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/meet" element={<MeetPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/sponsors" element={<SponsorsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/bio" element={<BioPage />} />
        <Route path="/seat-map" element={<SeatMapPage />} />
        <Route path="/index" element={<IndexPage />} />
      </Routes>
    </>
  )
}

export default App
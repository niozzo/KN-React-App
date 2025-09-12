// import React from 'react' // Not needed in React 17+
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MeetPage from './pages/MeetPage'
import SchedulePage from './pages/SchedulePage'
import SponsorsPage from './pages/SponsorsPage'
import SettingsPage from './pages/SettingsPage'
import BioPage from './pages/BioPage'
import SeatMapPage from './pages/SeatMapPage'
import IndexPage from './pages/IndexPage'

function App() {
  return (
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
  )
}

export default App
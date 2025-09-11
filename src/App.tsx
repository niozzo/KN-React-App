// import React from 'react' // Not needed in React 17+
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MeetPage from './pages/MeetPage'
import SchedulePage from './pages/SchedulePage'
import SponsorsPage from './pages/SponsorsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/meet" element={<MeetPage />} />
      <Route path="/schedule" element={<SchedulePage />} />
      <Route path="/sponsors" element={<SponsorsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      {/* Add more routes as we migrate pages */}
    </Routes>
  )
}

export default App
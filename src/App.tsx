import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MeetPage from './pages/MeetPage'
import SchedulePage from './pages/SchedulePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/meet" element={<MeetPage />} />
      <Route path="/schedule" element={<SchedulePage />} />
      {/* Add more routes as we migrate pages */}
    </Routes>
  )
}

export default App
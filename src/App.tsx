import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MeetPage from './pages/MeetPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/meet" element={<MeetPage />} />
      {/* Add more routes as we migrate pages */}
    </Routes>
  )
}

export default App
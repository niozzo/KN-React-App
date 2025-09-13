import React, { useState, useEffect } from 'react'

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {
    return null // Don't render anything when online
  }

  return (
    <div 
      data-testid="offline-indicator"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#f44336',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        zIndex: 1000
      }}
      aria-live="polite"
      role="status"
    >
      Offline
    </div>
  )
}

export default OfflineIndicator
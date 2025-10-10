import React, { useState, useEffect } from 'react'

const OfflineIndicator: React.FC = () => {
  // Enhanced offline detection with platform-specific handling
  const [isOnline, setIsOnline] = useState(() => {
    // Check multiple sources for online status
    const basicOnline = navigator.onLine
    
    // Additional checks for more reliable detection
    const hasConnection = navigator.connection && 
      navigator.connection.effectiveType !== 'offline'
    
    // Platform-specific detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSimulator = navigator.userAgent.includes('Simulator')
    
    // For iOS simulator, be more conservative with offline detection
    if (isIOS && isSimulator) {
      // Only show offline if we're definitely offline
      return basicOnline && hasConnection !== false
    }
    
    // For other platforms, use standard detection
    return basicOnline
  })

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Online event detected')
      setIsOnline(true)
    }
    
    const handleOffline = () => {
      console.log('📱 Offline event detected')
      setIsOnline(false)
    }

    // Enhanced event listeners with logging
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Additional network quality monitoring
    if (navigator.connection) {
      const handleConnectionChange = () => {
        const connection = navigator.connection
        console.log('📶 Connection changed:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        })
        
        // Update online status based on connection quality
        const isConnectionGood = connection.effectiveType !== 'offline' && 
                                connection.effectiveType !== 'slow-2g'
        setIsOnline(navigator.onLine && isConnectionGood)
      }
      
      navigator.connection.addEventListener('change', handleConnectionChange)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        navigator.connection.removeEventListener('change', handleConnectionChange)
      }
    }

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
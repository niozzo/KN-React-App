import React, { useState, useEffect } from 'react'

interface InstallPromptProps {
  onInstall?: () => void
  onDismiss?: () => void
  placement?: 'login' | 'home' | 'auto'
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onDismiss, placement = 'auto' }) => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)

  useEffect(() => {
    // Detect iOS Safari
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Detect if already installed (standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                              (window.navigator as any).standalone === true
    setIsStandalone(isInStandaloneMode)

    // Listen for the beforeinstallprompt event (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    // For iOS, show prompt after a delay if not already installed
    if (isIOSDevice && !isInStandaloneMode) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000) // Show after 3 seconds
      return () => clearTimeout(timer)
    }

    // For Chrome/Edge, listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Fallback timer for Chrome/Edge in development (10 seconds)
    // This helps with testing - remove in production
    if (!isIOSDevice && !isInStandaloneMode && (import.meta as any).env?.DEV) {
      const fallbackTimer = setTimeout(() => {
        if (!deferredPrompt) {
          setShowPrompt(true)
        }
      }, 10000) // Show after 10 seconds in dev mode
      return () => clearTimeout(fallbackTimer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS instructions modal
      setShowIOSModal(true)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        onInstall?.()
        setShowPrompt(false)
        setDeferredPrompt(null)
      } else {
        // User declined, keep prompt available
        setDeferredPrompt(null)
      }
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    onDismiss?.()
  }

  // Don't show if already installed
  if (isStandalone) {
    return null
  }

  // iOS Instructions Modal
  if (showIOSModal) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <div 
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#0E1821' }}>
            Apax KnowledgeNow 2025 App
          </h3>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#2A3745' }}>
              To install this app on your iPhone/iPad:
            </p>
            <ol style={{ margin: '0', paddingLeft: '20px', color: '#2A3745' }}>
              <li style={{ marginBottom: '8px' }}>Tap the Share button <span style={{ fontSize: '18px' }}>⎋</span> at the bottom of your screen</li>
              <li style={{ marginBottom: '8px' }}>Scroll down and tap "Add to Home Screen"</li>
              <li style={{ marginBottom: '8px' }}>Tap "Add" to confirm</li>
            </ol>
          </div>
          <button
            onClick={() => setShowIOSModal(false)}
            style={{
              width: '100%',
              backgroundColor: '#7C4CC4',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              border: 'none',
              fontWeight: '600'
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    )
  }

  if (!showPrompt) {
    return null
  }

  // Determine positioning based on placement
  const getPositionStyle = () => {
    if (placement === 'login') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '400px',
        width: '90%'
      }
    } else if (placement === 'home') {
      return {
        position: 'relative' as const,
        margin: '20px 0',
        maxWidth: '100%'
      }
    } else {
      return {
        position: 'fixed' as const,
        bottom: '20px',
        left: '20px',
        right: '20px',
        maxWidth: '400px',
        margin: '0 auto'
      }
    }
  }

  return (
    <div 
      data-testid="install-prompt"
      style={{
        ...getPositionStyle(),
        backgroundColor: 'white',
        border: '1px solid #D9DBDC',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(14,24,33,0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '28px', marginRight: '16px' }}>📱</div>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0E1821', fontWeight: '600' }}>
            Apax KnowledgeNow 2025 App
          </h3>
          <p style={{ margin: '0', fontSize: '14px', color: '#5A6A7A' }}>
            Install to get access even when offline
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleInstallClick}
          style={{
            flex: '1 1 0%',
            backgroundColor: '#7C4CC4',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            border: 'none',
            fontWeight: '600'
          }}
          aria-label="Install Apax KnowledgeNow 2025 app"
        >
          {isIOS ? 'Install Instructions' : 'Install'}
        </button>
        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: 'transparent',
            color: '#5A6A7A',
            border: '1px solid #D9DBDC',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}

export default InstallPrompt
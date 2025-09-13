import React, { useState, useEffect } from 'react'

interface InstallPromptProps {
  onInstall?: () => void
  onDismiss?: () => void
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onDismiss }) => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    console.log('Install clicked, deferredPrompt:', !!deferredPrompt)
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log('Installation outcome:', outcome)
      
      if (outcome === 'accepted') {
        console.log('Setting showPrompt to false')
        onInstall?.()
        setShowPrompt(false)
        setDeferredPrompt(null)
        console.log('Installation completed, component should hide')
      } else {
        console.log('User declined installation')
        setDeferredPrompt(null)
      }
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    onDismiss?.()
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div 
      data-testid="install-prompt"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        backgroundColor: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        maxWidth: '400px',
        margin: '0 auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '24px', marginRight: '12px' }}>📱</div>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#333' }}>
            Install Conference Companion
          </h3>
          <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
            Get quick access to your conference info
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleInstallClick}
          style={{
            flex: '1 1 0%',
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            border: 'none'
          }}
          aria-label="Install Conference Companion app"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #e0e0e0',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}

export default InstallPrompt
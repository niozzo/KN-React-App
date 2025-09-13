import React from 'react'

const OfflinePage: React.FC = () => {
  return (
    <div 
      data-testid="offline-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f5f5f5'
      }}
    >
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>📱</div>
      <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#333' }}>
        You're Offline
      </h1>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px', maxWidth: '400px' }}>
        It looks like you're not connected to the internet. Some features may not be available.
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Try Again
        </button>
        <button
          onClick={() => window.history.back()}
          style={{
            backgroundColor: 'transparent',
            color: '#1976d2',
            padding: '12px 24px',
            borderRadius: '4px',
            border: '1px solid #1976d2',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  )
}

export default OfflinePage
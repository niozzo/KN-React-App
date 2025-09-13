import React from 'react';

const OfflinePage: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        maxWidth: '400px',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          📱
        </div>
        <h1 style={{
          color: '#333',
          marginBottom: '16px',
          fontSize: '24px'
        }}>
          You're Offline
        </h1>
        <p style={{
          color: '#666',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          Don't worry! This app works offline. You can still access your conference information and schedule.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default OfflinePage;

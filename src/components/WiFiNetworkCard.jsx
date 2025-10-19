import React, { useState } from 'react';
import Card from './common/Card';
import Button from './common/Button';

const WiFiNetworkCard = () => {
  const [copied, setCopied] = useState(false);
  
  const networkName = "KnowledgeNow Conference";
  const password = "Apax2025";
  
  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = password;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card 
      className="wifi-network-card"
      style={{
        background: 'var(--white)',
        borderRadius: 'var(--radius-2xl)',
        padding: 'var(--space-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '2px solid var(--blue-200)',
        marginBottom: 'var(--space-lg)'
      }}
    >
      <div className="card-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 'var(--space-sm)'
      }}>
        <h3 
          className="wifi-title"
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--ink-900)',
            margin: 0
          }}
        >
          Conference WiFi
        </h3>
      </div>
      
      <div className="card-content">
        <div className="network-details" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div className="network-name" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ 
              fontSize: 'var(--text-base)', 
              color: 'var(--ink-700)',
              fontWeight: 'var(--font-medium)',
              minWidth: '60px'
            }}>
              Network:
            </span>
            <span style={{ 
              fontSize: 'var(--text-base)', 
              color: 'var(--coral)',
              fontWeight: 'var(--font-medium)'
            }}>
              {networkName}
            </span>
          </div>
          
          <div className="password-row" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ 
              fontSize: 'var(--text-base)', 
              color: 'var(--ink-700)',
              fontWeight: 'var(--font-medium)',
              minWidth: '60px'
            }}>
              Password:
            </span>
            <span style={{ 
              fontSize: 'var(--text-base)', 
              color: 'var(--coral)',
              fontWeight: 'var(--font-medium)',
              background: 'var(--blue-050)',
              padding: 'var(--space-xs) var(--space-sm)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--blue-200)'
            }}>
              {password}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyPassword}
              style={{
                padding: 'var(--space-xs) var(--space-sm)',
                fontSize: 'var(--text-sm)',
                minWidth: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                border: '1px solid var(--blue-300)',
                background: 'var(--white)',
                color: 'var(--blue-700)'
              }}
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WiFiNetworkCard;

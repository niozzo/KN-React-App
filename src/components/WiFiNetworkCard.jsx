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
        padding: 'var(--space-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '2px solid var(--blue-200)',
        marginBottom: 'var(--space-lg)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
        {/* WiFi Icon */}
        <div 
          className="wifi-icon"
          style={{
            width: '48px',
            height: '48px',
            background: 'var(--blue-050)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-2xl)',
            flexShrink: 0
          }}
        >
          📶
        </div>
        
        {/* Network Info */}
        <div className="wifi-content" style={{ flex: 1, minWidth: 0 }}>
          <h3 
            className="wifi-title"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--ink-900)',
              marginBottom: 'var(--space-sm)'
            }}
          >
            Conference WiFi
          </h3>
          
          <div className="network-details" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <div className="network-name" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--ink-600)',
                fontWeight: 'var(--font-medium)',
                minWidth: '60px'
              }}>
                Network:
              </span>
              <span style={{ 
                fontSize: 'var(--text-base)', 
                color: 'var(--ink-900)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 'var(--font-medium)'
              }}>
                {networkName}
              </span>
            </div>
            
            <div className="password-row" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ 
                fontSize: 'var(--text-sm)', 
                color: 'var(--ink-600)',
                fontWeight: 'var(--font-medium)',
                minWidth: '60px'
              }}>
                Password:
              </span>
              <span style={{ 
                fontSize: 'var(--text-base)', 
                color: 'var(--ink-900)',
                fontFamily: 'var(--font-mono)',
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
      </div>
    </Card>
  );
};

export default WiFiNetworkCard;

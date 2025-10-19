/**
 * Table Companions Widget Component
 * 
 * Displays an expandable widget showing who is sitting at the same table
 * Uses existing profile navigation patterns from sponsors page
 */

import React, { useState, useEffect } from 'react';
import { tableCompanionsService, TableCompanion } from '../../services/tableCompanionsService';

export interface TableCompanionsWidgetProps {
  diningEventId: string;
  tableName: string;
  attendeeId: string;
  className?: string;
}

export const TableCompanionsWidget: React.FC<TableCompanionsWidgetProps> = ({
  diningEventId,
  tableName,
  attendeeId,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [companions, setCompanions] = useState<TableCompanion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Load table companions from service
   */
  const loadCompanions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Loading companions for ${tableName}...`);
      const data = await tableCompanionsService.getTableCompanions(tableName, diningEventId);
      
      // Filter out current attendee
      const otherCompanions = data.filter(c => c.attendee_id !== attendeeId);
      setCompanions(otherCompanions);
      
      console.log(`✅ Loaded ${otherCompanions.length} companions for ${tableName}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load table companions';
      setError(errorMessage);
      console.error('❌ Table companions error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Toggle expanded state and load data if needed
   */
  const toggleExpanded = () => {
    if (!isExpanded && companions.length === 0 && !isLoading) {
      loadCompanions();
    }
    setIsExpanded(!isExpanded);
  };
  
  /**
   * Handle profile link click (reusing sponsors page pattern)
   */
  const handleProfileClick = (attendeeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Navigate to bio page (same pattern as sponsors page)
    window.location.href = `/bio?id=${attendeeId}`;
  };
  
  return (
    <div className={`table-companions-widget ${className}`}>
      <button 
        onClick={toggleExpanded}
        className="companions-toggle"
        aria-expanded={isExpanded}
        style={{
          width: '100%',
          padding: 'var(--space-md)',
          border: '2px solid var(--purple-200)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--white)',
          color: 'var(--ink-900)',
          fontSize: 'var(--text-lg)',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all var(--transition-normal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--purple-300)';
          e.currentTarget.style.backgroundColor = 'var(--purple-50)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--purple-200)';
          e.currentTarget.style.backgroundColor = 'var(--white)';
        }}
      >
        <span>
          {isLoading ? 'Loading...' : 'Who am I sitting with?'}
        </span>
        <span 
          style={{
            fontSize: '18px',
            transition: 'transform var(--transition-normal)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        >
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div 
          className="companions-list"
          style={{
            marginTop: 'var(--space-sm)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--white)',
            border: '1px solid var(--ink-200)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          {error ? (
            <div 
              className="error"
              style={{
                color: 'var(--red-600)',
                fontSize: 'var(--text-sm)',
                textAlign: 'center',
                padding: 'var(--space-md)'
              }}
            >
              Unable to load companions. Please try again.
            </div>
          ) : companions.length === 0 ? (
            <div 
              style={{
                color: 'var(--ink-600)',
                fontSize: 'var(--text-sm)',
                textAlign: 'center',
                padding: 'var(--space-md)'
              }}
            >
              No other companions found at this table.
            </div>
          ) : (
            <div>
              <h4 
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--ink-900)',
                  margin: '0 0 var(--space-md) 0',
                  textAlign: 'left'
                }}
              >
                Table Companions ({companions.length})
              </h4>
              <ul 
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  textAlign: 'left'
                }}
              >
                {companions.map((companion) => (
                  <li 
                    key={companion.attendee_id}
                    style={{
                      marginBottom: 'var(--space-sm)',
                      fontSize: '14px',
                      color: 'var(--ink-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <a
                      href={`/bio?id=${companion.attendee_id}`}
                      onClick={(e) => handleProfileClick(companion.attendee_id, e)}
                      style={{
                        color: 'var(--purple-700)',
                        textDecoration: 'none',
                        fontWeight: '500',
                        flex: 1
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                    >
                      {companion.first_name} {companion.last_name}
                    </a>
                    <span 
                      style={{ 
                        color: 'var(--ink-600)',
                        fontSize: '12px',
                        marginLeft: 'var(--space-sm)',
                        fontStyle: 'italic'
                      }}
                    >
                      {companion.title} at {companion.company_standardized}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableCompanionsWidget;

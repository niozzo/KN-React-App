/**
 * Breakout Session Mapping Configuration
 * Story 2.2.1: Breakout Session Filtering - AC 2
 * 
 * Centralized configuration for mapping attendee breakout selections to agenda items
 * This configuration can be easily updated for future agenda changes
 */

export interface BreakoutMappingConfig {
  keyPhrases: string[];
  caseInsensitive: boolean;
  exactMatchPriority: boolean;
  fallbackBehavior: 'hide' | 'show' | 'break';
}

export interface BreakoutMappingRule {
  attendeePattern: string;
  sessionPattern: string;
  description: string;
  priority: number;
}

/**
 * Default breakout mapping configuration
 * This configuration handles the current mapping requirements:
 * - Track A sessions
 * - Track B sessions  
 * - CEO Summit sessions
 */
export const defaultBreakoutMappingConfig: BreakoutMappingConfig = {
  keyPhrases: ['Track A', 'Track B', 'CEO'],
  caseInsensitive: true,
  exactMatchPriority: true,
  fallbackBehavior: 'break'
};

/**
 * Specific mapping rules for known breakout patterns
 * These rules provide more precise matching for common scenarios
 */
export const breakoutMappingRules: BreakoutMappingRule[] = [
  {
    attendeePattern: 'track-a',
    sessionPattern: 'Track A',
    description: 'Track A: Driving Revenue Growth sessions',
    priority: 1
  },
  {
    attendeePattern: 'track-b',
    sessionPattern: 'Track B', 
    description: 'Track B: Driving Operational Performance sessions',
    priority: 1
  },
  {
    attendeePattern: 'ceo',
    sessionPattern: 'CEO',
    description: 'CEO Summit sessions',
    priority: 1
  },
  {
    attendeePattern: 'track-a-revenue-growth',
    sessionPattern: 'Track A: Driving Revenue Growth',
    description: 'Specific Track A revenue growth sessions',
    priority: 2
  },
  {
    attendeePattern: 'track-b-operational-performance',
    sessionPattern: 'Track B: Driving Operational Performance',
    description: 'Specific Track B operational performance sessions',
    priority: 2
  },
  {
    attendeePattern: 'ceo-summit',
    sessionPattern: 'Apax Software CEO Summit',
    description: 'Specific CEO Summit sessions',
    priority: 2
  }
];

/**
 * Configuration for future agenda changes
 * This section documents how to add new breakout sessions
 */
export const breakoutMappingDocumentation = {
  title: 'Breakout Session Mapping Configuration Guide',
  version: '1.0.0',
  lastUpdated: '2025-01-27',
  
  howToAddNewSessions: {
    step1: 'Add new key phrase to keyPhrases array in defaultBreakoutMappingConfig',
    step2: 'Add specific mapping rule to breakoutMappingRules array if needed',
    step3: 'Update BreakoutMappingService to use new configuration',
    step4: 'Test mapping with new session titles',
    step5: 'Update documentation with new session patterns'
  },
  
  examples: {
    addingNewTrack: {
      description: 'Adding a new Track C session',
      keyPhrase: 'Track C',
      attendeePattern: 'track-c',
      sessionPattern: 'Track C: New Topic',
      priority: 1
    },
    addingSpecialSession: {
      description: 'Adding a special invitation-only session',
      keyPhrase: 'VIP',
      attendeePattern: 'vip-summit',
      sessionPattern: 'VIP Executive Summit',
      priority: 2
    }
  },
  
  maintenance: {
    regularUpdates: 'Review and update mapping rules quarterly',
    testing: 'Test all mapping rules with current agenda data',
    documentation: 'Keep examples and patterns up to date',
    performance: 'Monitor mapping performance with large datasets'
  }
};

/**
 * Configuration validation
 * Ensures configuration is valid and complete
 */
export const validateBreakoutMappingConfig = (config: BreakoutMappingConfig): boolean => {
  if (!config.keyPhrases || config.keyPhrases.length === 0) {
    return false;
  }
  
  if (typeof config.caseInsensitive !== 'boolean') {
    return false;
  }
  
  if (!['hide', 'show', 'break'].includes(config.fallbackBehavior)) {
    return false;
  }
  
  return true;
};

/**
 * Get configuration for external use
 * Returns a validated configuration object
 */
export const getBreakoutMappingConfig = (): BreakoutMappingConfig => {
  const config = { ...defaultBreakoutMappingConfig };
  
  if (!validateBreakoutMappingConfig(config)) {
    return {
      keyPhrases: ['Track A', 'Track B', 'CEO'],
      caseInsensitive: true,
      exactMatchPriority: true,
      fallbackBehavior: 'break'
    };
  }
  
  return config;
};

/**
 * Get mapping rules for external use
 * Returns sorted rules by priority
 */
export const getBreakoutMappingRules = (): BreakoutMappingRule[] => {
  return [...breakoutMappingRules].sort((a, b) => b.priority - a.priority);
};

/**
 * Configuration change log
 * Tracks changes to mapping configuration over time
 */
export const configurationChangeLog = [
  {
    date: '2025-01-27',
    version: '1.0.0',
    changes: [
      'Initial configuration setup',
      'Added Track A, Track B, and CEO mapping rules',
      'Implemented case-insensitive matching',
      'Added fallback behavior configuration'
    ],
    author: 'Development Team'
  }
];

# Breakout Session Mapping Configuration

## Overview

This document describes how to configure and maintain the breakout session mapping system for the Knowledge Now React App. The mapping system determines which breakout sessions are displayed to each attendee based on their `selected_breakouts` field.

## Configuration Files

- **Main Configuration**: `src/config/breakoutMappingConfig.ts`
- **Service Implementation**: `src/services/breakoutMappingService.ts`
- **Component Integration**: `src/hooks/useSessionData.js`

## Current Mapping Rules

### Key Phrases
The system matches breakout sessions using these key phrases:
- **Track A**: Matches sessions containing "Track A"
- **Track B**: Matches sessions containing "Track B"  
- **CEO**: Matches sessions containing "CEO"

### Specific Mapping Rules
The system includes specific rules for common patterns:

| Attendee Pattern | Session Pattern | Description | Priority |
|------------------|-----------------|-------------|----------|
| `track-a` | `Track A` | Track A sessions | 1 |
| `track-b` | `Track B` | Track B sessions | 1 |
| `ceo` | `CEO` | CEO Summit sessions | 1 |
| `track-a-revenue-growth` | `Track A: Driving Revenue Growth` | Specific Track A sessions | 2 |
| `track-b-operational-performance` | `Track B: Driving Operational Performance` | Specific Track B sessions | 2 |
| `ceo-summit` | `Apax Software CEO Summit` | Specific CEO Summit sessions | 2 |

## Adding New Breakout Sessions

### Step 1: Add Key Phrase
Add the new key phrase to the `keyPhrases` array in `defaultBreakoutMappingConfig`:

```typescript
export const defaultBreakoutMappingConfig: BreakoutMappingConfig = {
  keyPhrases: ['Track A', 'Track B', 'CEO', 'NEW_TRACK'], // Add new key phrase
  caseInsensitive: true,
  exactMatchPriority: true,
  fallbackBehavior: 'break'
};
```

### Step 2: Add Specific Mapping Rule
Add a specific mapping rule to the `breakoutMappingRules` array:

```typescript
{
  attendeePattern: 'new-track',
  sessionPattern: 'New Track: Session Title',
  description: 'New Track sessions',
  priority: 1
}
```

### Step 3: Test the Configuration
Test the new mapping with sample data:

```typescript
// Test data
const attendee = { selected_breakouts: ['new-track'] };
const session = { 
  title: 'New Track: Session Title',
  session_type: 'breakout' 
};

// Test mapping
const isAssigned = breakoutMappingService.isAttendeeAssignedToBreakout(session, attendee);
console.log('Mapping result:', isAssigned); // Should be true
```

## Configuration Options

### Case Sensitivity
```typescript
caseInsensitive: true  // Matches "track a" with "Track A"
```

### Exact Match Priority
```typescript
exactMatchPriority: true  // Tries exact title matching first
```

### Fallback Behavior
```typescript
fallbackBehavior: 'break'  // Options: 'hide', 'show', 'break'
```

## Maintenance

### Quarterly Reviews
- Review mapping rules against current agenda data
- Test all mapping rules with sample attendee data
- Update documentation with new session patterns

### Performance Monitoring
- Monitor mapping performance with large datasets
- Check for any performance degradation
- Optimize rules if needed

### Testing
- Run unit tests for all mapping rules
- Test integration with session filtering
- Verify cross-browser compatibility

## Troubleshooting

### Common Issues

#### Mapping Not Working
1. Check that the key phrase is in the `keyPhrases` array
2. Verify the attendee's `selected_breakouts` field format
3. Check console logs for debugging information

#### Performance Issues
1. Review the number of mapping rules
2. Check for inefficient pattern matching
3. Consider optimizing rule priorities

#### Configuration Errors
1. Validate configuration using `validateBreakoutMappingConfig()`
2. Check for typos in key phrases
3. Verify rule patterns are correct

### Debug Information
The system provides detailed console logging:
- `🔍 BreakoutMappingService Debug:` - Service initialization
- `🔍 MatchBreakoutToSession Debug:` - Matching process
- `✅ Rule match found:` - Successful matches
- `❌ No match found` - Failed matches

## Examples

### Adding a New Track
```typescript
// 1. Add to keyPhrases
keyPhrases: ['Track A', 'Track B', 'CEO', 'Track C']

// 2. Add specific rule
{
  attendeePattern: 'track-c',
  sessionPattern: 'Track C',
  description: 'Track C sessions',
  priority: 1
}
```

### Adding a Special Session
```typescript
// 1. Add to keyPhrases
keyPhrases: ['Track A', 'Track B', 'CEO', 'VIP']

// 2. Add specific rule
{
  attendeePattern: 'vip-summit',
  sessionPattern: 'VIP Executive Summit',
  description: 'VIP Executive Summit sessions',
  priority: 2
}
```

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|---------|
| 2025-01-27 | 1.0.0 | Initial configuration setup | Development Team |

## Support

For questions or issues with breakout session mapping:
1. Check this documentation first
2. Review console logs for debugging information
3. Test with sample data to isolate issues
4. Contact the development team if needed

# Time Override Guide

## Overview
The Knowledge Now React App includes time override functionality that allows you to test time-sensitive features like coffee break countdowns in production.

## How to Use Time Override

### 1. Open Browser Developer Tools
- Press `F12` or right-click and select "Inspect"
- Go to the "Console" tab

### 2. Set Time Override
```javascript
// Set a specific time (e.g., 10:00 AM on conference day)
TimeService.setOverrideTime(new Date('2024-09-17T10:00:00'));

// Set dynamic override (advances from start time)
TimeService.setDynamicOverrideTime(
  new Date('2024-09-17T10:00:00'), // Start time
  60000 // Update every minute (60000ms)
);
```

### 3. Test Coffee Break Countdown
```javascript
// Check if time override is working
console.log('Current time:', TimeService.getCurrentTime());

// The coffee break countdown will now use the override time
// and update in real-time based on your settings
```

### 4. Clear Time Override
```javascript
// Return to real time
TimeService.clearOverrideTime();
```

## Testing Coffee Break Treatment

1. **Set time to just before a coffee break session**
2. **Navigate to the app** - you should see the coffee break in "Next" status
3. **Set time to during the coffee break** - you should see:
   - Countdown timer in the time area (e.g., "23 minutes left")
   - Purple styling on the coffee break card
   - "NOW" status badge
4. **Set time to 5 minutes before end** - countdown should switch to MM:SS format
5. **Set time to after the coffee break** - should show next session

## Available Methods

- `TimeService.setOverrideTime(date)` - Set static override time
- `TimeService.setDynamicOverrideTime(startTime, interval)` - Set advancing time
- `TimeService.getCurrentTime()` - Get current time (real or override)
- `TimeService.clearOverrideTime()` - Clear all overrides
- `TimeService.isOverrideEnabled()` - Check if override is enabled

## Notes

- Time override is now enabled in production for testing
- Override time advances in real-time from the set start time
- All time-sensitive features (countdowns, session status) use the override time
- Changes persist in browser localStorage until cleared

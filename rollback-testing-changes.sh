#!/bin/bash
# Rollback script for temporary testing changes
# Run this after testing to revert to production settings

echo "🔄 Rolling back temporary testing changes..."

# Revert useSessionData.js refresh interval back to 5 minutes
sed -i '' 's/refreshInterval = 20000, \/\/ 20 seconds - TEMPORARY FOR TESTING/refreshInterval = 300000, \/\/ 5 minutes/' src/hooks/useSessionData.js

# Remove debug message from useSessionData.js
sed -i '' '/console.log('\''🔄 AUTO-REFRESH TRIGGERED - 20 second interval (TEMPORARY FOR TESTING)'\'');/d' src/hooks/useSessionData.js

# Remove debug message from agendaService.ts
sed -i '' '/console.log('\''🔄 BACKGROUND REFRESH TRIGGERED - 20 second interval (TEMPORARY FOR TESTING)'\'');/d' src/services/agendaService.ts

echo "✅ Testing changes rolled back successfully!"
echo "   - Refresh interval restored to 5 minutes"
echo "   - Debug messages removed"
echo "   - Ready for production"

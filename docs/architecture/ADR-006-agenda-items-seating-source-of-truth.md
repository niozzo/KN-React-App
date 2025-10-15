# ADR-006: Agenda Items as Source of Truth for Seating Requirements

**Date:** 2025-10-15  
**Status:** Accepted  
**Deciders:** Development Team  
**Technical Story:** [Story 2.1g.3.1](docs/stories/2.1g.3.1-QUICK-REFERENCE.md)

## Context and Problem Statement

The seating system had conflicting sources of truth for seating requirements:
- Agenda items had `seating_type` field
- Seating configurations had `seating_type` field
- These could be inconsistent, causing display issues

**Problem:** When agenda item says `seating_type: "assigned"` but seating configuration says `seating_type: "open"`, which should the UI respect?

## Decision Drivers

- **Business Logic Clarity**: Agenda items represent the actual events users see
- **Data Consistency**: Prevent conflicts between different sources
- **User Experience**: Users interact with agenda items, not seating configurations
- **Maintainability**: Single source of truth reduces complexity
- **Developer Experience**: Clear rules for which data to trust

## Considered Options

### Option 1: Seating Configurations as Source of Truth
- **Pros**: Configurations are more detailed, admin-controlled
- **Cons**: Users don't see configurations, creates disconnect
- **Rejected**: Creates poor UX and data inconsistency

### Option 2: Agenda Items as Source of Truth ✅
- **Pros**: Users see agenda items, clear business logic, single source of truth
- **Cons**: Requires careful data management
- **Chosen**: Best aligns with user experience and business logic

### Option 3: Hybrid Approach
- **Pros**: Could handle edge cases
- **Cons**: Adds complexity, unclear rules
- **Rejected**: Too complex for the problem

## Decision Outcome

**Chosen option:** Agenda items are the source of truth for seating requirements.

### Key Principles:
1. **Agenda items determine seating behavior** - `seating_type` field drives display logic
2. **Seating configurations provide layout only** - Used for seat generation and assignment storage
3. **No conflicting sources of truth** - Prevents data inconsistencies

### Implementation Rules:
- Session display logic prioritizes `agenda_item.seating_type` over `seating_configuration.seating_type`
- Seating configurations are used only for:
  - Layout definition
  - Seat assignment storage
  - NOT for determining if seating is assigned or open

## Consequences

### Positive:
- **Clear business logic**: Agenda items drive user experience
- **Data consistency**: Single source of truth
- **Better UX**: What users see matches what they get
- **Simpler code**: Clear rules for data precedence

### Negative:
- **Data management**: Must ensure agenda items are correctly configured
- **Admin workflow**: Must update agenda items, not just configurations

### Neutral:
- **Performance**: No significant impact
- **Security**: No change to access patterns

## Implementation Details

### Code Changes Required:
1. Update `useSessionData.js` to prioritize agenda item seating type
2. Update `SessionCard.jsx` to use agenda item seating type for display logic
3. Ensure seating configurations are cached for assignment lookup

### Data Migration:
- Review existing data for inconsistencies
- Update any mismatched seating types
- Document the new precedence rules

## Monitoring and Validation

### Success Criteria:
- [ ] Agenda items with `seating_type: "assigned"` show seat assignments or "pending"
- [ ] Agenda items with `seating_type: "open"` show "open seating"
- [ ] No conflicts between agenda items and seating configurations
- [ ] Clear documentation for future developers

### Rollback Plan:
- Revert code changes if issues arise
- Data remains unchanged, so no data migration rollback needed

## Related Documentation

- [Seating System Architecture](docs/architecture/seating-system-clarification.md)
- [Data Relationship Analysis](docs/architecture/data-relationship-analysis.md)
- [Story 2.1g.3.1 Implementation](docs/stories/2.1g.3.1-QUICK-REFERENCE.md)

## Notes

This decision simplifies the seating system architecture by establishing clear data precedence rules. It aligns the technical implementation with user experience and business logic.

---

*This ADR documents the architectural decision to make agenda items the source of truth for seating requirements, ensuring data consistency and clear business logic.*

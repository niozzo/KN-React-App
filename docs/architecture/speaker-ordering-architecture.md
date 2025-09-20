# Speaker Ordering Architecture

**Version:** 1.0  
**Last Updated:** 2025-01-16  
**Status:** DRAFT - Technical Design  
**Related Story:** 2.1b - Speaker Order Control Enhancement  

## Overview

This document defines the technical architecture for implementing speaker ordering functionality in the Knowledge Now React application. The enhancement allows administrators to control the order of speakers assigned to agenda items through drag-and-drop interface, with consistent display across admin and main application.

## Architecture Decision Record (ADR)

### ADR-004: Speaker Ordering Implementation

**Status:** Proposed  
**Date:** 2025-01-16  
**Context:** Need to implement speaker ordering for agenda items  

**Decision:** Implement drag-and-drop ordering with database persistence and mobile fallback  

**Rationale:**
- Drag-and-drop provides intuitive UX on desktop
- Database persistence ensures consistency across sessions
- Mobile fallback ensures accessibility on all devices
- Leverages existing speaker assignment infrastructure

## Database Schema Changes

### Speaker Assignments Table Update

```sql
-- Add display_order column to speaker_assignments table
ALTER TABLE speaker_assignments 
ADD COLUMN display_order INTEGER NOT NULL DEFAULT 1;

-- Create index for efficient ordering queries
CREATE INDEX idx_speaker_assignments_order 
ON speaker_assignments(agenda_item_id, display_order);

-- Update existing records to have proper ordering
UPDATE speaker_assignments 
SET display_order = ROW_NUMBER() OVER (PARTITION BY agenda_item_id ORDER BY created_at);
```

### Data Model Updates

```typescript
// Updated SpeakerAssignment interface
export interface SpeakerAssignment {
  id: string;
  agenda_item_id: string;
  attendee_id: string;
  role: string;
  display_order: number; // NEW: Order within agenda item
  created_at: string;
  updated_at: string;
}
```

## UI/UX Architecture

### Desktop Implementation: Drag-and-Drop

```typescript
// Drag-and-drop component using react-beautiful-dnd
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface SpeakerOrderingProps {
  speakers: SpeakerAssignment[];
  onReorder: (speakers: SpeakerAssignment[]) => void;
}

export const SpeakerOrdering: React.FC<SpeakerOrderingProps> = ({
  speakers,
  onReorder
}) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const reorderedSpeakers = reorder(
      speakers,
      result.source.index,
      result.destination.index
    );
    
    // Update display_order values
    const updatedSpeakers = reorderedSpeakers.map((speaker, index) => ({
      ...speaker,
      display_order: index + 1
    }));
    
    onReorder(updatedSpeakers);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="speakers">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {speakers.map((speaker, index) => (
              <Draggable key={speaker.id} draggableId={speaker.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`speaker-item ${snapshot.isDragging ? 'dragging' : ''}`}
                  >
                    <span className="order-number">{index + 1}</span>
                    <span className="speaker-name">{speaker.attendee_name}</span>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
```

### Mobile Implementation: Up/Down Arrows

```typescript
// Mobile-friendly ordering component
interface MobileSpeakerOrderingProps {
  speakers: SpeakerAssignment[];
  onReorder: (speakers: SpeakerAssignment[]) => void;
}

export const MobileSpeakerOrdering: React.FC<MobileSpeakerOrderingProps> = ({
  speakers,
  onReorder
}) => {
  const moveSpeaker = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= speakers.length) return;
    
    const reorderedSpeakers = [...speakers];
    [reorderedSpeakers[index], reorderedSpeakers[newIndex]] = 
    [reorderedSpeakers[newIndex], reorderedSpeakers[index]];
    
    // Update display_order values
    const updatedSpeakers = reorderedSpeakers.map((speaker, index) => ({
      ...speaker,
      display_order: index + 1
    }));
    
    onReorder(updatedSpeakers);
  };

  return (
    <div className="mobile-speaker-ordering">
      {speakers.map((speaker, index) => (
        <div key={speaker.id} className="speaker-item">
          <span className="order-number">{index + 1}</span>
          <span className="speaker-name">{speaker.attendee_name}</span>
          <div className="order-controls">
            <button
              onClick={() => moveSpeaker(index, 'up')}
              disabled={index === 0}
              className="move-up"
            >
              ↑
            </button>
            <button
              onClick={() => moveSpeaker(index, 'down')}
              disabled={index === speakers.length - 1}
              className="move-down"
            >
              ↓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## Service Layer Updates

### Admin Service Enhancements

```typescript
// Updated AdminService methods
export class AdminService {
  /**
   * Reorder speakers for an agenda item
   */
  async reorderSpeakers(
    agendaItemId: string, 
    reorderedSpeakers: SpeakerAssignment[]
  ): Promise<void> {
    try {
      // Update database with new order
      for (const speaker of reorderedSpeakers) {
        await applicationDbService.updateSpeakerOrder(
          speaker.id, 
          speaker.display_order
        );
      }
      
      // Update local cache
      await this.updateLocalSpeakerAssignments(reorderedSpeakers);
      
    } catch (error) {
      console.error('Failed to reorder speakers:', error);
      throw error;
    }
  }

  /**
   * Get speakers ordered by display_order
   */
  async getSpeakersForAgendaItem(agendaItemId: string): Promise<SpeakerAssignment[]> {
    const assignments = await pwaDataSyncService.getCachedTableData('speaker_assignments');
    
    return assignments
      .filter((assignment: SpeakerAssignment) => 
        assignment.agenda_item_id === agendaItemId
      )
      .sort((a: SpeakerAssignment, b: SpeakerAssignment) => 
        a.display_order - b.display_order
      );
  }
}
```

### Application Database Service Updates

```typescript
// New methods for speaker ordering
export class ApplicationDatabaseService {
  /**
   * Update speaker display order
   */
  async updateSpeakerOrder(
    speakerId: string, 
    displayOrder: number
  ): Promise<void> {
    const { error } = await this.adminDb
      .from('speaker_assignments')
      .update({ 
        display_order: displayOrder,
        updated_at: new Date().toISOString()
      })
      .eq('id', speakerId);
    
    if (error) throw error;
  }

  /**
   * Reorder all speakers for an agenda item
   */
  async reorderSpeakersForAgendaItem(
    agendaItemId: string,
    speakerOrders: { id: string; display_order: number }[]
  ): Promise<void> {
    // Use transaction for atomic updates
    const { error } = await this.adminDb.rpc('reorder_speakers', {
      p_agenda_item_id: agendaItemId,
      p_speaker_orders: speakerOrders
    });
    
    if (error) throw error;
  }
}
```

## Database Functions

### Reorder Speakers Function

```sql
-- Create function for atomic speaker reordering
CREATE OR REPLACE FUNCTION reorder_speakers(
  p_agenda_item_id TEXT,
  p_speaker_orders JSONB
) RETURNS VOID AS $$
DECLARE
  speaker_order JSONB;
BEGIN
  -- Update each speaker's display_order
  FOR speaker_order IN SELECT * FROM jsonb_array_elements(p_speaker_orders)
  LOOP
    UPDATE speaker_assignments
    SET 
      display_order = (speaker_order->>'display_order')::INTEGER,
      updated_at = NOW()
    WHERE 
      id = (speaker_order->>'id')::TEXT
      AND agenda_item_id = p_agenda_item_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Main Application Integration

### Agenda Display Updates

```typescript
// Updated agenda display to show speakers in order
export const AgendaItemCard: React.FC<AgendaItemCardProps> = ({ item }) => {
  const [speakers, setSpeakers] = useState<SpeakerAssignment[]>([]);

  useEffect(() => {
    const loadSpeakers = async () => {
      const orderedSpeakers = await adminService.getSpeakersForAgendaItem(item.id);
      setSpeakers(orderedSpeakers);
    };
    
    loadSpeakers();
  }, [item.id]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{item.title}</Typography>
        
        {/* Display speakers in order */}
        <div className="speakers-list">
          {speakers.map((speaker, index) => (
            <Chip
              key={speaker.id}
              label={`${index + 1}. ${speaker.attendee_name}`}
              className="speaker-chip"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

## Responsive Design Strategy

### Breakpoint-Based Component Selection

```typescript
// Responsive speaker ordering component
export const ResponsiveSpeakerOrdering: React.FC<SpeakerOrderingProps> = (props) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? (
    <MobileSpeakerOrdering {...props} />
  ) : (
    <SpeakerOrdering {...props} />
  );
};
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading:** Load speaker order only when needed
2. **Debounced Updates:** Debounce database updates during drag operations
3. **Optimistic Updates:** Update UI immediately, sync to database asynchronously
4. **Caching:** Cache ordered speakers in localStorage

### Database Indexing

```sql
-- Optimize queries for speaker ordering
CREATE INDEX idx_speaker_assignments_agenda_order 
ON speaker_assignments(agenda_item_id, display_order);

-- Partial index for active assignments
CREATE INDEX idx_active_speaker_assignments 
ON speaker_assignments(agenda_item_id, display_order) 
WHERE role = 'presenter';
```

## Security Considerations

### Access Control

- Only authenticated admins can reorder speakers
- Use service role key for database updates
- Validate agenda item ownership before reordering
- Audit trail for speaker order changes

### Data Validation

```typescript
// Validate speaker order updates
const validateSpeakerOrder = (speakers: SpeakerAssignment[]): boolean => {
  // Check for duplicate display_order values
  const orders = speakers.map(s => s.display_order);
  const uniqueOrders = new Set(orders);
  
  if (orders.length !== uniqueOrders.size) {
    throw new Error('Duplicate display_order values found');
  }
  
  // Check for sequential ordering
  const sortedOrders = [...orders].sort((a, b) => a - b);
  for (let i = 0; i < sortedOrders.length; i++) {
    if (sortedOrders[i] !== i + 1) {
      throw new Error('Non-sequential display_order values');
    }
  }
  
  return true;
};
```

## Testing Strategy

### Unit Tests
- Speaker ordering logic
- Database update functions
- UI component behavior
- Validation functions

### Integration Tests
- End-to-end reordering flow
- Database persistence
- Cache synchronization
- Cross-component updates

### E2E Tests
- Drag-and-drop functionality
- Mobile ordering controls
- Order persistence across sessions
- Multi-device consistency

## Migration Strategy

### Database Migration

1. Add `display_order` column with default value
2. Populate existing records with sequential ordering
3. Create indexes for performance
4. Add database functions for atomic updates

### Application Migration

1. Update data models and interfaces
2. Implement new UI components
3. Update service layer methods
4. Add responsive design logic
5. Update main application display

## Success Metrics

- **Functionality:** Drag-and-drop works on desktop
- **Mobile Support:** Up/down arrows work on touch devices
- **Performance:** Reordering completes within 200ms
- **Consistency:** Order maintained across all views
- **Reliability:** 99.9% success rate for order updates

## Future Enhancements

- **Bulk Reordering:** Reorder multiple agenda items at once
- **Template Ordering:** Save and reuse speaker order templates
- **Visual Timeline:** Timeline view of speaker order
- **Conflict Resolution:** Handle concurrent ordering updates

---

**This architecture provides a robust, scalable solution for speaker ordering that maintains data integrity while providing an excellent user experience across all devices.**

import React, { useState, useEffect } from 'react';
// @ts-ignore - JSX files don't have type declarations
import Card, { CardContent } from './common/Card';
// @ts-ignore - JSX files don't have type declarations
import Button from './common/Button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SpeakerAssignment } from '../services/applicationDatabaseService';

interface SpeakerOrderingProps {
  speakers: SpeakerAssignment[];
  onReorder: (speakers: SpeakerAssignment[]) => void;
  disabled?: boolean;
}

interface SortableSpeakerItemProps {
  speaker: SpeakerAssignment & { attendee_name?: string };
  index: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled?: boolean;
}

const SortableSpeakerItem: React.FC<SortableSpeakerItemProps> = ({
  speaker,
  index,
  onMoveUp: _onMoveUp,
  onMoveDown: _onMoveDown,
  canMoveUp: _canMoveUp,
  canMoveDown: _canMoveDown,
  disabled = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: speaker.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={{
        ...style,
        marginBottom: 'var(--space-sm)',
        cursor: disabled ? 'default' : 'grab',
        opacity: isDragging ? 0.5 : 1,
      }}
      className="speaker-item"
    >
      <CardContent style={{ padding: 'var(--space-sm)' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--space-sm)',
          width: '100%'
        }}>
          {/* Order Number */}
          <div style={{
            background: 'var(--purple-100)',
            color: 'var(--purple-700)',
            borderRadius: 'var(--radius-full)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'var(--font-bold)',
            fontSize: 'var(--text-sm)',
            flexShrink: 0
          }}>
            {index + 1}
          </div>
          
          {/* Speaker Name */}
          <div style={{ 
            flexGrow: 1,
            fontSize: 'var(--text-sm)',
            color: 'var(--ink-900)',
            fontWeight: 'var(--font-medium)'
          }}>
            {speaker.attendee_name || `Speaker ${speaker.attendee_id}`}
          </div>
          
          {/* Role */}
          <div style={{
            background: 'var(--gray-100)',
            color: 'var(--ink-700)',
            border: '1px solid var(--gray-300)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-xs) var(--space-sm)',
            fontSize: 'var(--text-xs)',
            textTransform: 'capitalize',
            fontWeight: 'var(--font-medium)',
            flexShrink: 0
          }}>
            {speaker.role}
          </div>
          
          {/* Drag Handle (Desktop) */}
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            {...attributes}
            {...listeners}
            style={{ 
              opacity: disabled ? 0.3 : 1,
              padding: 'var(--space-xs)',
              minWidth: '32px',
              height: '32px',
              flexShrink: 0
            }}
          >
            ⋮⋮
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const MobileSpeakerItem: React.FC<SortableSpeakerItemProps> = ({
  speaker,
  index,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  disabled = false
}) => {
  return (
    <Card style={{ marginBottom: 'var(--space-sm)' }}>
      <CardContent style={{ padding: 'var(--space-sm)' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--space-sm)',
          width: '100%'
        }}>
          {/* Order Number */}
          <div style={{
            background: 'var(--purple-100)',
            color: 'var(--purple-700)',
            borderRadius: 'var(--radius-full)',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'var(--font-bold)',
            fontSize: 'var(--text-sm)',
            flexShrink: 0
          }}>
            {index + 1}
          </div>
          
          {/* Speaker Name */}
          <div style={{ 
            flexGrow: 1,
            fontSize: 'var(--text-sm)',
            color: 'var(--ink-900)',
            fontWeight: 'var(--font-medium)'
          }}>
            {speaker.attendee_name || `Speaker ${speaker.attendee_id}`}
          </div>
          
          {/* Role */}
          <div style={{
            background: 'var(--gray-100)',
            color: 'var(--ink-700)',
            border: '1px solid var(--gray-300)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-xs) var(--space-sm)',
            fontSize: 'var(--text-xs)',
            textTransform: 'capitalize',
            fontWeight: 'var(--font-medium)',
            flexShrink: 0
          }}>
            {speaker.role}
          </div>
          
          {/* Mobile Controls */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 'var(--space-xs)',
            flexShrink: 0
          }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled || !canMoveUp}
              onClick={onMoveUp}
              style={{ 
                padding: 'var(--space-xs)',
                minWidth: '32px',
                height: '24px',
                opacity: (disabled || !canMoveUp) ? 0.3 : 1
              }}
            >
              ↑
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={disabled || !canMoveDown}
              onClick={onMoveDown}
              style={{ 
                padding: 'var(--space-xs)',
                minWidth: '32px',
                height: '24px',
                opacity: (disabled || !canMoveDown) ? 0.3 : 1
              }}
            >
              ↓
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const SpeakerOrdering: React.FC<SpeakerOrderingProps> = ({
  speakers,
  onReorder,
  disabled = false
}) => {
  const [localSpeakers, setLocalSpeakers] = useState<SpeakerAssignment[]>(speakers);
  const [isMobile, setIsMobile] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setLocalSpeakers(speakers);
  }, [speakers]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = localSpeakers.findIndex(speaker => speaker.id === active.id);
      const newIndex = localSpeakers.findIndex(speaker => speaker.id === over?.id);

      const reorderedSpeakers = arrayMove(localSpeakers, oldIndex, newIndex);
      setLocalSpeakers(reorderedSpeakers);
      onReorder(reorderedSpeakers);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const reorderedSpeakers = [...localSpeakers];
      [reorderedSpeakers[index - 1], reorderedSpeakers[index]] = 
      [reorderedSpeakers[index], reorderedSpeakers[index - 1]];
      setLocalSpeakers(reorderedSpeakers);
      onReorder(reorderedSpeakers);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < localSpeakers.length - 1) {
      const reorderedSpeakers = [...localSpeakers];
      [reorderedSpeakers[index], reorderedSpeakers[index + 1]] = 
      [reorderedSpeakers[index + 1], reorderedSpeakers[index]];
      setLocalSpeakers(reorderedSpeakers);
      onReorder(reorderedSpeakers);
    }
  };

  if (localSpeakers.length === 0) {
    return (
      <div style={{ 
        padding: 'var(--space-lg)', 
        textAlign: 'center',
        color: 'var(--ink-600)',
        fontSize: 'var(--text-sm)'
      }}>
        No speakers assigned
      </div>
    );
  }

  if (isMobile) {
    return (
      <div>
        {localSpeakers.map((speaker, index) => (
          <MobileSpeakerItem
            key={speaker.id}
            speaker={speaker}
            index={index}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            canMoveUp={index > 0}
            canMoveDown={index < localSpeakers.length - 1}
            disabled={disabled}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localSpeakers.map(s => s.id)}
        strategy={verticalListSortingStrategy}
      >
        {localSpeakers.map((speaker, index) => (
          <SortableSpeakerItem
            key={speaker.id}
            speaker={speaker}
            index={index}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            canMoveUp={index > 0}
            canMoveDown={index < localSpeakers.length - 1}
            disabled={disabled}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};

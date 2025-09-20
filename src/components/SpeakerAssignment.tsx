import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Autocomplete,
  TextField,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Reorder as ReorderIcon } from '@mui/icons-material';
import { SpeakerAssignment } from '../services/applicationDatabaseService';
import { SpeakerOrdering } from './SpeakerOrdering';

interface SpeakerAssignmentProps {
  agendaItemId: string;
  assignments: SpeakerAssignment[];
  availableAttendees: any[];
  onAssignmentsChange: (assignments: SpeakerAssignment[]) => void;
}

export const SpeakerAssignmentComponent: React.FC<SpeakerAssignmentProps> = ({
  agendaItemId,
  assignments,
  availableAttendees,
  onAssignmentsChange
}) => {
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOrderingMode, setIsOrderingMode] = useState(false);
  const [reorderingLoading, setReorderingLoading] = useState(false);

  const handleAddAssignment = async () => {
    if (!selectedAttendee) return;
    
    // Check if already assigned
    if (assignments.some(a => a.attendee_id === selectedAttendee.id)) {
      setError('This attendee is already assigned to this agenda item');
      return;
    }

    // Check assignment limit
    if (assignments.length >= 10) {
      setError('Maximum 10 attendees can be assigned to an agenda item');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { adminService } = await import('../services/adminService');
      const newAssignment = await adminService.assignSpeakerToAgendaItem(
        agendaItemId,
        selectedAttendee.id,
        'presenter'
      );
      
      onAssignmentsChange([...assignments, newAssignment]);
      setSelectedAttendee(null);
    } catch (err) {
      setError('Failed to assign speaker. Please try again.');
      console.error('Error assigning speaker:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    setLoading(true);
    setError('');

    try {
      const { adminService } = await import('../services/adminService');
      await adminService.removeSpeakerFromAgendaItem(assignmentId);
      
      onAssignmentsChange(assignments.filter(a => a.id !== assignmentId));
    } catch (err) {
      setError('Failed to remove speaker assignment. Please try again.');
      console.error('Error removing speaker assignment:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAttendeeName = (attendeeId: string) => {
    const attendee = availableAttendees.find(a => a.id === attendeeId);
    if (!attendee) return 'Unknown';
    
    // Handle different name field structures
    if (attendee.name) return attendee.name;
    if (attendee.first_name && attendee.last_name) {
      return `${attendee.first_name} ${attendee.last_name}`;
    }
    if (attendee.first_name) return attendee.first_name;
    if (attendee.last_name) return attendee.last_name;
    return 'Unknown';
  };

  const handleReorderSpeakers = async (reorderedSpeakers: SpeakerAssignment[]) => {
    setReorderingLoading(true);
    setError('');

    try {
      const { adminService } = await import('../services/adminService');
      await adminService.reorderSpeakers(agendaItemId, reorderedSpeakers);
      
      // Update local state
      onAssignmentsChange(reorderedSpeakers);
      
    } catch (err) {
      setError('Failed to reorder speakers. Please try again.');
      console.error('Error reordering speakers:', err);
    } finally {
      setReorderingLoading(false);
    }
  };

  const toggleOrderingMode = () => {
    setIsOrderingMode(!isOrderingMode);
    setError('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2">
          Speaker Assignments ({assignments.length}/10)
        </Typography>
        
        {assignments.length > 1 && (
          <IconButton
            onClick={toggleOrderingMode}
            size="small"
            color={isOrderingMode ? 'primary' : 'default'}
            sx={{ ml: 1 }}
          >
            <ReorderIcon />
          </IconButton>
        )}
      </Box>

      {/* Current Assignments */}
      {isOrderingMode ? (
        <Box sx={{ mb: 2 }}>
          <SpeakerOrdering
            speakers={assignments.map(assignment => ({
              ...assignment,
              attendee_name: getAttendeeName(assignment.attendee_id)
            }))}
            onReorder={handleReorderSpeakers}
            disabled={reorderingLoading}
          />
          {reorderingLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ mb: 2, minHeight: 40 }}>
          {assignments.map((assignment) => (
            <Chip
              key={assignment.id}
              label={getAttendeeName(assignment.attendee_id)}
              onDelete={() => handleRemoveAssignment(assignment.id)}
              deleteIcon={<DeleteIcon />}
              disabled={loading}
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>
      )}

      {/* Add New Assignment */}
      {availableAttendees.length === 0 ? (
        <Alert severity="info" sx={{ mt: 1 }}>
          No attendees available. Please load attendee data from the home page first.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Autocomplete
            options={availableAttendees}
            getOptionLabel={(option) => {
              // Handle different name field structures
              if (option.name) return option.name;
              if (option.first_name && option.last_name) {
                return `${option.first_name} ${option.last_name}`;
              }
              if (option.first_name) return option.first_name;
              if (option.last_name) return option.last_name;
              return 'Unknown';
            }}
            value={selectedAttendee}
            onChange={(_, newValue) => setSelectedAttendee(newValue)}
            disabled={loading}
            sx={{ flexGrow: 1 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search attendees..."
                placeholder="Type at least 2 characters"
                size="small"
              />
            )}
            filterOptions={(options, { inputValue }) => {
              // Only show options if user has typed at least 2 characters
              if (inputValue.length < 2) return [];
              return options.filter(option => {
                if (!option) return false;
                
                // Check different name field structures
                let nameToSearch = '';
                if (option.name && typeof option.name === 'string') {
                  nameToSearch = option.name;
                } else if (option.first_name && option.last_name) {
                  nameToSearch = `${option.first_name} ${option.last_name}`;
                } else if (option.first_name) {
                  nameToSearch = option.first_name;
                } else if (option.last_name) {
                  nameToSearch = option.last_name;
                }
                
                return nameToSearch.toLowerCase().includes(inputValue.toLowerCase());
              });
            }}
          />
          
          <IconButton
            onClick={handleAddAssignment}
            disabled={!selectedAttendee || loading || assignments.length >= 10}
            color="primary"
          >
            {loading ? <CircularProgress size={20} /> : <AddIcon />}
          </IconButton>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

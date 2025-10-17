import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { simplifiedDataService } from '../services/simplifiedDataService';
import { ValidationRules } from '../utils/validationUtils';

interface OutletContext {
  onLogout: () => void;
}

export const AdminPage: React.FC = () => {
  const { onLogout } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [agendaItems, setAgendaItems] = useState<any[]>([]);
  const [diningOptions, setDiningOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingDiningTitle, setEditingDiningTitle] = useState<string | null>(null);
  const [titleValue, setTitleValue] = useState('');
  const [diningTitleValue, setDiningTitleValue] = useState('');
  const [titleValidationError, setTitleValidationError] = useState('');
  const [diningTitleValidationError, setDiningTitleValidationError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Simplified: Load only basic agenda items and dining options for title editing
      console.log('📋 Loading agenda items...');
      const agendaResponse = await simplifiedDataService.getAgendaItems();
      console.log('📋 Agenda response:', agendaResponse);
      if (agendaResponse.success && agendaResponse.data) {
        setAgendaItems(agendaResponse.data);
        console.log('📋 Set agenda items:', agendaResponse.data.length);
      } else {
        console.warn('📋 No agenda items loaded:', agendaResponse);
      }

      console.log('🍽️ Loading dining options...');
      const diningResponse = await simplifiedDataService.getDiningOptions();
      console.log('🍽️ Dining response:', diningResponse);
      if (diningResponse.success && diningResponse.data) {
        setDiningOptions(diningResponse.data);
        console.log('🍽️ Set dining options:', diningResponse.data.length);
      } else {
        console.warn('🍽️ No dining options loaded:', diningResponse);
      }

      console.log('✅ Admin data loaded successfully');

    } catch (err) {
      setError('Failed to load admin data. Please try again.');
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTitleEdit = (itemId: string, currentTitle: string) => {
    setEditingTitle(itemId);
    setTitleValue(currentTitle);
    setTitleValidationError('');
  };

  const handleDiningTitleEdit = (itemId: string, currentTitle: string) => {
    setEditingDiningTitle(itemId);
    setDiningTitleValue(currentTitle);
    setDiningTitleValidationError('');
  };

  const handleTitleChange = (value: string) => {
    setTitleValue(value);
    setTitleValidationError('');
    
    // Real-time validation
    if (value.trim()) {
      const result = ValidationRules.title(value.trim(), 'Title');
      if (!result.isValid) {
        setTitleValidationError(result.message);
      }
    }
  };

  const handleDiningTitleChange = (value: string) => {
    setDiningTitleValue(value);
    setDiningTitleValidationError('');
    
    // Real-time validation
    if (value.trim()) {
      const result = ValidationRules.title(value.trim(), 'Title');
      if (!result.isValid) {
        setDiningTitleValidationError(result.message);
      }
    }
  };

  const handleTitleSave = async (itemId: string) => {
    // Validate title format
    const titleResult = ValidationRules.title(titleValue.trim(), 'Title');
    if (!titleResult.isValid) {
      setTitleValidationError(titleResult.message);
      return;
    }

    // Validate title is not empty
    if (!adminService.validateTitle(titleValue)) {
      setError('Title cannot be empty');
      return;
    }

    try {
      const oldTitle = agendaItems.find(item => item.id === itemId)?.title;
      await adminService.updateAgendaItemTitle(itemId, titleValue);
      
      // Admin action logging
      console.log('🔧 Admin modified agenda item:', { itemId, oldTitle, newTitle: titleValue });
      
      // Update local state
      setAgendaItems(items => 
        items.map(item => 
          item.id === itemId ? { ...item, title: titleValue } : item
        )
      );
      
      setEditingTitle(null);
      setTitleValue('');
      setTitleValidationError('');
    } catch (err) {
      setError('Failed to update title. Please try again.');
      console.error('Error updating title:', err);
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(null);
    setTitleValue('');
    setTitleValidationError('');
  };

  const handleDiningTitleSave = async (itemId: string) => {
    // Validate title format
    const titleResult = ValidationRules.title(diningTitleValue.trim(), 'Title');
    if (!titleResult.isValid) {
      setDiningTitleValidationError(titleResult.message);
      return;
    }

    // Validate title is not empty
    if (!adminService.validateTitle(diningTitleValue)) {
      setError('Title cannot be empty');
      return;
    }

    try {
      const oldName = diningOptions.find(option => option.id === itemId)?.name;
      await adminService.updateDiningOptionTitle(itemId, diningTitleValue);
      
      // Admin action logging
      console.log('🔧 Admin modified dining option:', { itemId, oldName, newName: diningTitleValue });
      
      // Update local state
      setDiningOptions(options => 
        options.map(option => 
          option.id === itemId ? { ...option, name: diningTitleValue } : option
        )
      );
      
      setEditingDiningTitle(null);
      setDiningTitleValue('');
      setDiningTitleValidationError('');
    } catch (err) {
      setError('Failed to update dining option title. Please try again.');
      console.error('Error updating dining option title:', err);
    }
  };

  const handleDiningTitleCancel = () => {
    setEditingDiningTitle(null);
    setDiningTitleValue('');
    setDiningTitleValidationError('');
  };

  // Speaker assignment management removed - now handled by main DB agenda_item_speakers




  const extractTimeFromTimestamp = (timestamp: string): string => {
    if (!timestamp) return '';
    
    // If it's already in HH:MM format, return as-is
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timestamp)) {
      return timestamp.substring(0, 5); // Ensure HH:MM format
    }
    
    // If it's a full timestamp, extract time part
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return '';
      }
      return date.toTimeString().substring(0, 5); // HH:MM format
    } catch (error) {
      console.warn('Error parsing timestamp:', timestamp, error);
      return '';
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Attendee Lookup
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefreshData}>
                Refresh Data
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Typography variant="h4" gutterBottom>
          Agenda Items
        </Typography>

        {agendaItems.length === 0 && !loading ? (
          <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <HomeIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No Agenda Items Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                To use the admin panel, you need to have agenda items and attendee data loaded in the application.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Please go to the home page first to load your conference data, then return to the admin panel.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/')}
                sx={{ mr: 2 }}
              >
                Go to Home Page
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => window.location.reload()}
              >
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        ) : (
          <List>
            {agendaItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem sx={{ px: 0 }}>
                  <Card sx={{ width: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {editingTitle === item.id ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <TextField
                              value={titleValue}
                              onChange={(e) => handleTitleChange(e.target.value)}
                              size="small"
                              sx={{ flexGrow: 1, mr: 1 }}
                              autoFocus
                              error={!!titleValidationError}
                              helperText={titleValidationError}
                              inputProps={{
                                maxLength: 200
                              }}
                            />
                            <Button
                              size="small"
                              startIcon={<SaveIcon />}
                              onClick={() => handleTitleSave(item.id)}
                              disabled={!!titleValidationError || !titleValue.trim()}
                              sx={{ mr: 1 }}
                            >
                              Save
                            </Button>
                            <Button
                              size="small"
                              onClick={handleTitleCancel}
                            >
                              Cancel
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                              {item.title}
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => handleTitleEdit(item.id, item.title)}
                            >
                              Edit Title
                            </Button>
                          </Box>
                        )}
                      </Box>

                      {/* Display speakers (read-only) */}
                      {item.speakers && item.speakers.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Speakers:
                          </Typography>
                          {item.speakers.map((speaker: any, idx: number) => {
                            // Use standardized company name if available, fallback to raw company name
                            const company = speaker.company_standardized || speaker.company || '';
                            const companyDisplay = company ? ` (${company})` : '';
                            return (
                              <Chip
                                key={speaker.id}
                                label={`${idx + 1}. ${speaker.first_name} ${speaker.last_name}${companyDisplay}`}
                                size="small"
                                sx={{ mr: 0.5, mt: 0.5 }}
                              />
                            );
                          })}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </ListItem>
                {index < agendaItems.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Dining Options Section */}
        <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
          Dining Options
        </Typography>

        {diningOptions.length === 0 ? (
          <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h6" gutterBottom>
                No Dining Options Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No dining options are currently available for editing.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <List>
            {diningOptions.map((option, index) => (
              <React.Fragment key={option.id}>
                <ListItem sx={{ px: 0 }}>
                  <Card sx={{ width: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {editingDiningTitle === option.id ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <TextField
                              value={diningTitleValue}
                              onChange={(e) => handleDiningTitleChange(e.target.value)}
                              size="small"
                              sx={{ flexGrow: 1, mr: 1 }}
                              autoFocus
                              error={!!diningTitleValidationError}
                              helperText={diningTitleValidationError}
                              inputProps={{
                                maxLength: 200
                              }}
                            />
                            <Button
                              size="small"
                              startIcon={<SaveIcon />}
                              onClick={() => handleDiningTitleSave(option.id)}
                              disabled={!!diningTitleValidationError || !diningTitleValue.trim()}
                              sx={{ mr: 1 }}
                            >
                              Save
                            </Button>
                            <Button
                              size="small"
                              onClick={handleDiningTitleCancel}
                            >
                              Cancel
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                              {option.name}
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => handleDiningTitleEdit(option.id, option.name)}
                            >
                              Edit Title
                            </Button>
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Date:</strong> {option.date}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Time:</strong> {option.time}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Location:</strong> {option.location}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Capacity:</strong> {option.capacity} seats
                        </Typography>
                      </Box>

                      {option.original_name && option.original_name !== option.name && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Original: {option.original_name}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </ListItem>
                {index < diningOptions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}


      </Box>
    </Box>
  );
};

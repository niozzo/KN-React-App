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
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, Home as HomeIcon, Dashboard as DashboardIcon, AccessTime as AccessTimeIcon, Sync as SyncIcon } from '@mui/icons-material';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { dataInitializationService } from '../services/dataInitializationService';
import { pwaDataSyncService } from '../services/pwaDataSyncService';
import CacheHealthDashboard from './CacheHealthDashboard';
import { ValidationRules } from '../utils/validationUtils';
import { TimeOverridePanel } from './admin/TimeOverridePanel';

interface OutletContext {
  onLogout: () => void;
}

export const AdminPage: React.FC = () => {
  const { onLogout } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [agendaItems, setAgendaItems] = useState<any[]>([]);
  const [diningOptions, setDiningOptions] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingDiningTitle, setEditingDiningTitle] = useState<string | null>(null);
  const [titleValue, setTitleValue] = useState('');
  const [diningTitleValue, setDiningTitleValue] = useState('');
  const [titleValidationError, setTitleValidationError] = useState('');
  const [diningTitleValidationError, setDiningTitleValidationError] = useState('');
  const [showDashboard, setShowDashboard] = useState(false);
  const [timeOverrideItem, setTimeOverrideItem] = useState<any>(null);
  const [forceSyncLoading, setForceSyncLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Ensure data is loaded (admin-specific, no user auth required)
      console.log('🔄 Initializing admin data...');
      const initResult = await dataInitializationService.ensureDataLoadedForAdmin();
      
      if (!initResult.success) {
        setError(initResult.error || 'Failed to load conference data.');
        return;
      }

      if (!initResult.hasData) {
        setError('No conference data found. Please load your conference data first.');
        return;
      }

      // Step 2: Load agenda items with assignments
      console.log('📋 Loading agenda items...');
      const itemsWithAssignments = await adminService.getAgendaItemsWithAssignments();
      setAgendaItems(itemsWithAssignments);

      // Step 3: Load dining options with metadata
      console.log('🍽️ Loading dining options...');
      const optionsWithMetadata = await adminService.getDiningOptionsWithMetadata();
      setDiningOptions(optionsWithMetadata);

      // Step 4: Load available attendees
      console.log('👥 Loading attendees...');
      const availableAttendees = await adminService.getAvailableAttendees();
      setAttendees(availableAttendees);

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

  const handleRefreshData = async () => {
    console.log('🔄 Refreshing data...');
    await loadData();
  };

  const handleForceSyncApplicationDb = async () => {
    try {
      console.log('🔄 Force syncing application database...');
      setLoading(true);
      setError('');
      
      // Force sync application database tables
      const applicationTables = ['speaker_assignments', 'agenda_item_metadata', 'attendee_metadata', 'dining_item_metadata'];
      
      for (const tableName of applicationTables) {
        try {
          await pwaDataSyncService.syncApplicationTable(tableName);
          console.log(`✅ Synced ${tableName}`);
        } catch (error) {
          console.warn(`⚠️ Failed to sync ${tableName}:`, error);
        }
      }
      
      // Reload data after sync
      await loadData();
      
    } catch (error) {
      setError('Failed to sync application database. Please try again.');
      console.error('Error syncing application database:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceGlobalSync = async () => {
    const syncStartTime = new Date().toISOString();
    const syncId = `sync_${Date.now()}`;
    
    try {
      console.log(`🔄 [${syncId}] Force global sync started at ${syncStartTime}`);
      setForceSyncLoading(true);
      setError('');
      
      // Step 1: Clear all cached data to force fresh fetch
      console.log(`🔄 [${syncId}] Step 1: Clearing all caches...`);
      await pwaDataSyncService.clearCache();
      console.log(`✅ [${syncId}] Cleared all PWA caches`);
      
      // Step 2: Force sync all data (not just application DB)
      console.log(`🔄 [${syncId}] Step 2: Force syncing all data...`);
      const syncResult = await pwaDataSyncService.forceSync();
      // Force sync completed
      
      // Step 3: Force refresh attendee data to update conference_auth
      console.log(`🔄 [${syncId}] Step 3: Force refreshing attendee data...`);
      try {
        const { attendeeSyncService } = await import('../services/attendeeSyncService');
        const attendeeResult = await attendeeSyncService.refreshAttendeeData();
        if (attendeeResult.success) {
          console.log(`✅ [${syncId}] Attendee data refreshed successfully`);
        } else {
          console.warn(`⚠️ [${syncId}] Attendee data refresh failed:`, attendeeResult.error);
        }
      } catch (attendeeError) {
        console.warn(`⚠️ [${syncId}] Attendee data refresh error:`, attendeeError);
      }
      
      // Step 4: Reload all admin data
      console.log(`🔄 [${syncId}] Step 4: Reloading admin panel data...`);
      await loadData();
      
      const syncEndTime = new Date().toISOString();
      const duration = new Date(syncEndTime).getTime() - new Date(syncStartTime).getTime();
      
      // Force global sync completed
      console.log(`📊 [${syncId}] Sync Summary:`, {
        syncId,
        startTime: syncStartTime,
        endTime: syncEndTime,
        duration: `${duration}ms`,
        syncResult: syncResult.success,
        syncedTables: syncResult.syncedTables?.length || 0,
        totalRecords: syncResult.totalRecords || 0,
        errors: syncResult.errors?.length || 0,
        attendeeDataRefreshed: true,
        conferenceAuthUpdated: true
      });
      
    } catch (error) {
      const syncEndTime = new Date().toISOString();
      const duration = new Date(syncEndTime).getTime() - new Date(syncStartTime).getTime();
      
      console.error(`❌ [${syncId}] Force global sync failed after ${duration}ms:`, error);
      console.error(`📊 [${syncId}] Error Summary:`, {
        syncId,
        startTime: syncStartTime,
        endTime: syncEndTime,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      setError(`Failed to force global sync: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setForceSyncLoading(false);
    }
  };

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

  const handleTimeOverride = (item: any) => {
    console.log('🕐 Opening time override for item:', item);
    console.log('🕐 Item properties:', {
      id: item.id,
      title: item.title,
      start_time: item.start_time,
      end_time: item.end_time,
      type: typeof item.start_time,
      allKeys: Object.keys(item)
    });
    
    // Convert timestamps to time format for the panel
    const processedItem = {
      ...item,
      start_time: extractTimeFromTimestamp(item.start_time),
      end_time: extractTimeFromTimestamp(item.end_time)
    };
    
    console.log('🕐 Processed item for TimeOverridePanel:', {
      id: processedItem.id,
      title: processedItem.title,
      start_time: processedItem.start_time,
      end_time: processedItem.end_time
    });
    
    setTimeOverrideItem(processedItem);
  };

  const handleTimeUpdate = async (startTime: string, endTime: string, enabled: boolean) => {
    try {
      // Refresh agenda items to show updated times
      await loadData();
      setTimeOverrideItem(null);
      console.log('✅ Time override updated successfully');
    } catch (error) {
      console.error('❌ Failed to refresh data after time update:', error);
      // Still close the panel even if refresh fails
      setTimeOverrideItem(null);
    }
  };

  const handleTimeOverrideClose = () => {
    setTimeOverrideItem(null);
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
            Speaker Management Admin
          </Typography>
          <Button
            color="inherit"
            startIcon={<SyncIcon />}
            onClick={handleForceGlobalSync}
            disabled={forceSyncLoading}
            sx={{ 
              mr: 1,
              backgroundColor: forceSyncLoading ? 'rgba(255,255,255,0.2)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            {forceSyncLoading ? 'Syncing...' : 'Force Global Sync'}
          </Button>
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => setShowDashboard(!showDashboard)}
            sx={{ 
              backgroundColor: showDashboard ? 'rgba(255,255,255,0.2)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Cache Health
          </Button>
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

        {agendaItems.length === 0 ? (
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
                onClick={handleRefreshData}
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
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                onClick={() => handleTitleEdit(item.id, item.title)}
                              >
                                Edit Title
                              </Button>
                              <Button
                                size="small"
                                startIcon={<AccessTimeIcon />}
                                onClick={() => handleTimeOverride(item)}
                                variant="outlined"
                              >
                                Override Times
                              </Button>
                            </Box>
                          </Box>
                        )}
                      </Box>

                      {/* Display speakers (read-only) */}
                      {item.speakers && item.speakers.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Speakers:
                          </Typography>
                          {item.speakers.map((speaker: any, idx: number) => (
                            <Chip
                              key={speaker.id}
                              label={`${idx + 1}. ${speaker.first_name} ${speaker.last_name}`}
                              size="small"
                              sx={{ mr: 0.5, mt: 0.5 }}
                            />
                          ))}
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

        {/* Cache Health Dashboard */}
        {showDashboard && (
          <Box sx={{ mt: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Cache Health Dashboard
                </Typography>
                <CacheHealthDashboard isVisible={true} />
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Time Override Panel */}
        {timeOverrideItem && (
          <TimeOverridePanel
            agendaItemId={timeOverrideItem.id}
            currentStartTime={timeOverrideItem.start_time}
            currentEndTime={timeOverrideItem.end_time}
            currentTitle={timeOverrideItem.title}
            onTimeUpdate={handleTimeUpdate}
            onClose={handleTimeOverrideClose}
          />
        )}
      </Box>
    </Box>
  );
};

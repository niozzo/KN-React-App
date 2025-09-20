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
  Divider
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, Home as HomeIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SpeakerAssignmentComponent } from './SpeakerAssignment';
import { adminService } from '../services/adminService';
import { SpeakerAssignment } from '../services/applicationDatabaseService';
import { dataInitializationService } from '../services/dataInitializationService';
import CacheHealthDashboard from './CacheHealthDashboard';

interface AdminPageProps {
  onLogout: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [agendaItems, setAgendaItems] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleValue, setTitleValue] = useState('');
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      setRequiresAuth(false);

      // Step 1: Ensure data is loaded (follows authentication-first pattern)
      console.log('🔄 Initializing admin data...');
      const initResult = await dataInitializationService.ensureDataLoaded();
      
      if (!initResult.success) {
        if (initResult.requiresAuthentication) {
          setRequiresAuth(true);
          setError('Please log in to access the admin panel.');
          return;
        } else {
          setError(initResult.error || 'Failed to load conference data.');
          return;
        }
      }

      if (!initResult.hasData) {
        setError('No conference data found. Please load your conference data first.');
        return;
      }

      // Step 2: Load agenda items with assignments
      console.log('📋 Loading agenda items...');
      const itemsWithAssignments = await adminService.getAgendaItemsWithAssignments();
      setAgendaItems(itemsWithAssignments);

      // Step 3: Load available attendees
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
  };

  const handleTitleSave = async (itemId: string) => {
    if (!adminService.validateTitle(titleValue)) {
      setError('Title cannot be empty');
      return;
    }

    try {
      await adminService.updateAgendaItemTitle(itemId, titleValue);
      
      // Update local state
      setAgendaItems(items => 
        items.map(item => 
          item.id === itemId ? { ...item, title: titleValue } : item
        )
      );
      
      setEditingTitle(null);
      setTitleValue('');
    } catch (err) {
      setError('Failed to update title. Please try again.');
      console.error('Error updating title:', err);
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(null);
    setTitleValue('');
  };

  const handleAssignmentsChange = (itemId: string, assignments: SpeakerAssignment[]) => {
    setAgendaItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, speaker_assignments: assignments } : item
      )
    );
  };

  const handleRefreshData = async () => {
    console.log('🔄 Refreshing data...');
    await loadData();
  };

  const handleGoToLogin = () => {
    navigate('/');
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
          <IconButton edge="start" color="inherit" onClick={onLogout} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Speaker Management Admin
          </Typography>
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
            severity={requiresAuth ? "warning" : "error"} 
            sx={{ mb: 3 }}
            action={
              requiresAuth ? (
                <Button color="inherit" size="small" onClick={handleGoToLogin}>
                  Go to Login
                </Button>
              ) : (
                <Button color="inherit" size="small" onClick={handleRefreshData}>
                  Refresh Data
                </Button>
              )
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
                              onChange={(e) => setTitleValue(e.target.value)}
                              size="small"
                              sx={{ flexGrow: 1, mr: 1 }}
                              autoFocus
                            />
                            <Button
                              size="small"
                              startIcon={<SaveIcon />}
                              onClick={() => handleTitleSave(item.id)}
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

                      <SpeakerAssignmentComponent
                        agendaItemId={item.id}
                        assignments={item.speaker_assignments || []}
                        availableAttendees={attendees}
                        onAssignmentsChange={(assignments) => handleAssignmentsChange(item.id, assignments)}
                      />
                    </CardContent>
                  </Card>
                </ListItem>
                {index < agendaItems.length - 1 && <Divider />}
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
      </Box>
    </Box>
  );
};

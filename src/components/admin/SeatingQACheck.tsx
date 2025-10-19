/**
 * Seating QA Check Component
 * Validates seat assignment consistency and compares with CSV data
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { seatingQAService, AttendeeSeatingQA, SeatingIssue } from '../../services/seatingQAService';

interface OutletContext {
  onLogout: () => void;
}

export const SeatingQACheck: React.FC = () => {
  const navigate = useNavigate();
  const { onLogout } = useOutletContext<OutletContext>();

  const [qaData, setQaData] = useState<AttendeeSeatingQA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryStats, setSummaryStats] = useState<any>(null);

  useEffect(() => {
    loadSeatingQA();
  }, []);

  const loadSeatingQA = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await seatingQAService.getAllAttendeesSeatingQA();
      setQaData(data);
      
      const stats = seatingQAService.getSummaryStats(data);
      setSummaryStats(stats);
      
      console.log('📊 Seating QA loaded:', {
        totalAttendees: stats.totalAttendees,
        attendeesWithIssues: stats.attendeesWithIssues,
        totalIssues: stats.totalIssues
      });
    } catch (err) {
      setError('Failed to load seating QA data. Please try again.');
      console.error('Error loading seating QA:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'inconsistent':
        return <ErrorIcon color="error" />;
      case 'csv_mismatch':
        return <WarningIcon color="warning" />;
      case 'missing_assignment':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'inconsistent':
        return 'error';
      case 'csv_mismatch':
        return 'warning';
      case 'missing_assignment':
        return 'error';
      default:
        return 'default';
    }
  };

  const getIssueLabel = (type: string) => {
    switch (type) {
      case 'inconsistent':
        return 'Inconsistent Assignment';
      case 'csv_mismatch':
        return 'CSV Mismatch';
      case 'missing_assignment':
        return 'Missing Assignment';
      default:
        return 'Unknown Issue';
    }
  };

  // Filter attendees with issues
  const attendeesWithInconsistentIssues = qaData.filter(attendee => 
    attendee.issues.some(issue => issue.type === 'inconsistent')
  );

  const attendeesWithCSVMismatches = qaData.filter(attendee => 
    attendee.issues.some(issue => issue.type === 'csv_mismatch')
  );

  const attendeesWithMissingAssignments = qaData.filter(attendee => 
    attendee.issues.some(issue => issue.type === 'missing_assignment')
  );

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Seating QA Check
          </Typography>
          <Button 
            color="inherit" 
            onClick={onLogout}
            startIcon={<ArrowBackIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Seating Quality Assurance
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary Statistics */}
            {summaryStats && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Summary Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {summaryStats.totalAttendees}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Attendees
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="error">
                          {summaryStats.attendeesWithIssues}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Attendees with Issues
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="warning.main">
                          {summaryStats.inconsistentIssues}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Inconsistent Assignments
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {summaryStats.csvMismatchIssues}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          CSV Mismatches
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={loadSeatingQA}
                      disabled={loading}
                    >
                      Refresh Data
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Inconsistent Seat Assignments */}
            <Accordion defaultExpanded={attendeesWithInconsistentIssues.length > 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon color="error" />
                  <Typography variant="h6">
                    Inconsistent Seat Assignments
                  </Typography>
                  <Chip 
                    label={attendeesWithInconsistentIssues.length} 
                    color="error" 
                    size="small" 
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {attendeesWithInconsistentIssues.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" color="success.main">
                      No Inconsistent Assignments Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All attendees have consistent seat assignments across the 7 main sessions
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Attendee</strong></TableCell>
                          <TableCell><strong>Session</strong></TableCell>
                          <TableCell><strong>Expected</strong></TableCell>
                          <TableCell><strong>Actual</strong></TableCell>
                          <TableCell><strong>Issue</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendeesWithInconsistentIssues.map(attendee => 
                          attendee.issues
                            .filter(issue => issue.type === 'inconsistent')
                            .map((issue, index) => (
                              <TableRow key={`${attendee.attendeeId}-${index}`}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {attendee.attendeeName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {attendee.email}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {issue.sessionName}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    Row: {issue.expectedRow || 'null'}, Col: {issue.expectedColumn || 'null'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Table: {issue.expectedTable || 'null'}, Seat: {issue.expectedSeat || 'null'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    Row: {issue.actualRow || 'null'}, Col: {issue.actualColumn || 'null'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Table: {issue.actualTable || 'null'}, Seat: {issue.actualSeat || 'null'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    icon={getIssueIcon(issue.type)}
                                    label={getIssueLabel(issue.type)}
                                    color={getIssueColor(issue.type) as any}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>

            {/* CSV Data Mismatches */}
            <Accordion defaultExpanded={attendeesWithCSVMismatches.length > 0} sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="warning" />
                  <Typography variant="h6">
                    CSV Data Mismatches
                  </Typography>
                  <Chip 
                    label={attendeesWithCSVMismatches.length} 
                    color="warning" 
                    size="small" 
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {attendeesWithCSVMismatches.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" color="success.main">
                      No CSV Mismatches Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All database data matches the CSV export
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Attendee</strong></TableCell>
                          <TableCell><strong>Session</strong></TableCell>
                          <TableCell><strong>CSV Data</strong></TableCell>
                          <TableCell><strong>Database Data</strong></TableCell>
                          <TableCell><strong>Issue</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendeesWithCSVMismatches.map(attendee => 
                          attendee.issues
                            .filter(issue => issue.type === 'csv_mismatch')
                            .map((issue, index) => (
                              <TableRow key={`${attendee.attendeeId}-${index}`}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {attendee.attendeeName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {attendee.email}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {issue.sessionName}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    Row: {issue.expectedRow || 'null'}, Col: {issue.expectedColumn || 'null'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Table: {issue.expectedTable || 'null'}, Seat: {issue.expectedSeat || 'null'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    Row: {issue.actualRow || 'null'}, Col: {issue.actualColumn || 'null'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Table: {issue.actualTable || 'null'}, Seat: {issue.actualSeat || 'null'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    icon={getIssueIcon(issue.type)}
                                    label={getIssueLabel(issue.type)}
                                    color={getIssueColor(issue.type) as any}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Missing Assignments */}
            {attendeesWithMissingAssignments.length > 0 && (
              <Accordion defaultExpanded sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorIcon color="error" />
                    <Typography variant="h6">
                      Missing Assignments
                    </Typography>
                    <Chip 
                      label={attendeesWithMissingAssignments.length} 
                      color="error" 
                      size="small" 
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Attendee</strong></TableCell>
                          <TableCell><strong>Issue Details</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendeesWithMissingAssignments.map(attendee => 
                          attendee.issues
                            .filter(issue => issue.type === 'missing_assignment')
                            .map((issue, index) => (
                              <TableRow key={`${attendee.attendeeId}-${index}`}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {attendee.attendeeName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {attendee.email}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {issue.details}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

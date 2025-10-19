/**
 * QR Code Generator Component
 * Generates QR codes and shareable URLs for attendee access codes
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
  Autocomplete,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { adminService } from '../../services/adminService';
import { generateAttendeeCSV, downloadCSV } from '../../utils/csvExport';

interface OutletContext {
  onLogout: () => void;
}

interface AttendeeWithCode {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  access_code: string;
}

export const QRCodeGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { onLogout } = useOutletContext<OutletContext>();

  const [attendees, setAttendees] = useState<AttendeeWithCode[]>([]);
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeWithCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [seatAssignments, setSeatAssignments] = useState<any[]>([]);
  const [loadingSeatAssignments, setLoadingSeatAssignments] = useState(false);

  useEffect(() => {
    loadAttendees();
  }, []);

  const loadAttendees = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getAllAttendeesWithAccessCodes();
      setAttendees(data);
    } catch (err) {
      setError('Failed to load attendees. Please try again.');
      console.error('Error loading attendees:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSeatAssignments = async (attendeeId: string) => {
    try {
      setLoadingSeatAssignments(true);
      setError('');
      const data = await adminService.getSeatAssignmentsForAttendee(attendeeId);
      setSeatAssignments(data);
    } catch (err) {
      setError('Failed to load seat assignments. Please try again.');
      console.error('Error loading seat assignments:', err);
    } finally {
      setLoadingSeatAssignments(false);
    }
  };

  const generateURL = (accessCode: string): string => {
    return `${window.location.origin}/login?code=${accessCode}`;
  };

  const handleCopyURL = async () => {
    if (!selectedAttendee) return;

    const url = generateURL(selectedAttendee.access_code);
    
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
      setError('Failed to copy URL to clipboard');
    }
  };

  const handleDownloadQR = () => {
    if (!selectedAttendee) return;

    try {
      const svg = document.getElementById('qr-code-svg') as unknown as SVGElement;
      if (!svg) {
        setError('QR code not found');
        return;
      }

      // Create canvas from SVG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Canvas not supported');
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `qr-code-${selectedAttendee.first_name}-${selectedAttendee.last_name}.png`;
            link.href = downloadUrl;
            link.click();
            URL.revokeObjectURL(downloadUrl);
          }
        });

        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        setError('Failed to generate QR code image');
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (err) {
      console.error('Error downloading QR code:', err);
      setError('Failed to download QR code');
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };

  const handleExportCSV = () => {
    try {
      // Filter attendees to only include confirmed ones for CSV export
      const confirmedAttendees = attendees.filter(attendee => 
        attendee.registration_status === 'confirmed'
      );
      
      const csvContent = generateAttendeeCSV(confirmedAttendees);
      const filename = `attendee-urls-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV file');
    }
  };

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
            QR Code Generator
          </Typography>
          <Button
            color="inherit"
            startIcon={<TableChartIcon />}
            onClick={handleExportCSV}
            disabled={loading || attendees.length === 0}
            sx={{ mr: 2 }}
          >
            Export CSV
          </Button>
          <Button color="inherit" onClick={onLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {copySuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setCopySuccess(false)}>
            URL copied to clipboard!
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Attendee Selector */}
          <Card sx={{ flex: 1, maxWidth: { md: 400 } }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Select Attendee
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TableChartIcon />}
                  onClick={handleExportCSV}
                  disabled={loading || attendees.length === 0}
                >
                  Export All URLs
                </Button>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Autocomplete
                  options={attendees}
                  value={selectedAttendee}
                  onChange={(_, newValue) => {
                    setSelectedAttendee(newValue);
                    if (newValue) {
                      loadSeatAssignments(newValue.id);
                    } else {
                      setSeatAssignments([]);
                    }
                  }}
                  getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body1">
                          {option.first_name} {option.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {option.email} • {option.access_code}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  filterOptions={(options, state) => {
                    // Only show options if user types at least 2 characters
                    if (state.inputValue.trim().length < 2) {
                      return [];
                    }
                    
                    const query = state.inputValue.toLowerCase();
                    return options.filter(
                      (option) =>
                        option.first_name.toLowerCase().includes(query) ||
                        option.last_name.toLowerCase().includes(query) ||
                        option.email.toLowerCase().includes(query) ||
                        option.access_code.toLowerCase().includes(query)
                    );
                  }}
                  noOptionsText="Enter at least 2 characters to search"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search by name, email, or code..."
                      variant="outlined"
                      size="small"
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              )}
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              {selectedAttendee ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    QR Code for {selectedAttendee.first_name} {selectedAttendee.last_name}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    {/* QR Code */}
                    <Paper elevation={3} sx={{ p: 3, bgcolor: 'white' }}>
                      <QRCodeSVG
                        id="qr-code-svg"
                        value={generateURL(selectedAttendee.access_code)}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </Paper>

                    {/* Attendee Details */}
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Name:</strong> {selectedAttendee.first_name} {selectedAttendee.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Email:</strong> {selectedAttendee.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Access Code:</strong> {selectedAttendee.access_code}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                        <strong>URL:</strong> {generateURL(selectedAttendee.access_code)}
                      </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                      <Button
                        variant="contained"
                        startIcon={<CopyIcon />}
                        onClick={handleCopyURL}
                        fullWidth
                      >
                        Copy URL
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadQR}
                        fullWidth
                      >
                        Download QR
                      </Button>
                    </Stack>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    Select an attendee to generate QR code
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Search and click on an attendee from the list
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Seat Assignments Card */}
        {selectedAttendee && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Raw Seat Assignment Data
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => selectedAttendee && loadSeatAssignments(selectedAttendee.id)}
                  disabled={loadingSeatAssignments}
                >
                  Refresh
                </Button>
              </Box>

              {loadingSeatAssignments ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : seatAssignments.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Session Name</strong></TableCell>
                        <TableCell><strong>Session Type</strong></TableCell>
                        <TableCell><strong>Row</strong></TableCell>
                        <TableCell><strong>Column</strong></TableCell>
                        <TableCell><strong>Table</strong></TableCell>
                        <TableCell><strong>Seat</strong></TableCell>
                        <TableCell><strong>Assigned At</strong></TableCell>
                        <TableCell><strong>Assignment Type</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {seatAssignments.map((assignment, index) => (
                        <TableRow key={assignment.id || index}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {assignment.session_name}
                            </Typography>
                            {assignment.session_time && (
                              <Typography variant="caption" color="text.secondary">
                                {new Date(assignment.session_time.start).toLocaleString()} - {new Date(assignment.session_time.end).toLocaleString()}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={assignment.session_type} 
                              size="small" 
                              color={assignment.session_type === 'Agenda Item' ? 'primary' : 'secondary'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {assignment.row_number !== null ? (
                              <Chip 
                                label={assignment.row_number} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">null</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment.column_number !== null ? (
                              <Chip 
                                label={assignment.column_number} 
                                size="small" 
                                color="secondary" 
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">null</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment.table_name ? (
                              <Chip 
                                label={assignment.table_name} 
                                size="small" 
                                color="success" 
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">null</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment.seat_number !== null ? (
                              <Chip 
                                label={assignment.seat_number} 
                                size="small" 
                                color="info" 
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">null</Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {new Date(assignment.assigned_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={assignment.assignment_type || 'N/A'} 
                              size="small" 
                              color={assignment.assignment_type === 'manual' ? 'warning' : 'default'}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No seat assignments found for this attendee
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    This attendee may not have been assigned to any sessions with seating
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};


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
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
  Divider,
  Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { adminService } from '../../services/adminService';

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
  const [filteredAttendees, setFilteredAttendees] = useState<AttendeeWithCode[]>([]);
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeWithCode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadAttendees();
  }, []);

  useEffect(() => {
    // Filter attendees based on search query
    if (searchQuery.trim() === '') {
      setFilteredAttendees(attendees);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAttendees(
        attendees.filter(
          (a) =>
            a.first_name.toLowerCase().includes(query) ||
            a.last_name.toLowerCase().includes(query) ||
            a.email.toLowerCase().includes(query) ||
            a.access_code.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, attendees]);

  const loadAttendees = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getAllAttendeesWithAccessCodes();
      setAttendees(data);
      setFilteredAttendees(data);
    } catch (err) {
      setError('Failed to load attendees. Please try again.');
      console.error('Error loading attendees:', err);
    } finally {
      setLoading(false);
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
          {/* Attendee List */}
          <Card sx={{ flex: 1, maxWidth: { md: 400 } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Attendee
              </Typography>

              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by name, email, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
                size="small"
              />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {filteredAttendees.length} attendee{filteredAttendees.length !== 1 ? 's' : ''} found
                  </Typography>

                  <List sx={{ maxHeight: 500, overflow: 'auto', bgcolor: '#fafafa', borderRadius: 1 }}>
                    {filteredAttendees.map((attendee) => (
                      <ListItem key={attendee.id} disablePadding>
                        <ListItemButton
                          selected={selectedAttendee?.id === attendee.id}
                          onClick={() => setSelectedAttendee(attendee)}
                        >
                          <ListItemText
                            primary={`${attendee.first_name} ${attendee.last_name}`}
                            secondary={`${attendee.email} • ${attendee.access_code}`}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </>
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
      </Box>
    </Box>
  );
};


/**
 * Admin Dashboard Component
 * Navigation hub for admin functions
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Button
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  QrCode2 as QrCodeIcon,
  Speed as SpeedIcon,
  AccessTime as AccessTimeIcon,
  ExitToApp as ExitIcon
} from '@mui/icons-material';
import { useNavigate, useOutletContext } from 'react-router-dom';

interface OutletContext {
  onLogout: () => void;
}

interface AdminCard {
  title: string;
  description: string;
  icon: React.ReactElement;
  path: string;
  color: string;
}

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { onLogout } = useOutletContext<OutletContext>();

  const adminCards: AdminCard[] = [
    {
      title: 'Agenda Management',
      description: 'Manage agenda items, speaker assignments, and dining options',
      icon: <DashboardIcon sx={{ fontSize: 48 }} />,
      path: '/admin/manage',
      color: '#1976d2'
    },
    {
      title: 'QR Code Generator',
      description: 'Generate QR codes and shareable URLs for attendee access',
      icon: <QrCodeIcon sx={{ fontSize: 48 }} />,
      path: '/admin/qr-generator',
      color: '#2e7d32'
    },
    {
      title: 'Cache Health',
      description: 'Monitor cache status and data synchronization',
      icon: <SpeedIcon sx={{ fontSize: 48 }} />,
      path: '/admin/cache-health',
      color: '#ed6c02'
    },
    {
      title: 'Time Override',
      description: 'Override breakout session times',
      icon: <AccessTimeIcon sx={{ fontSize: 48 }} />,
      path: '/admin/time-override',
      color: '#9c27b0'
    }
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button 
            color="inherit" 
            onClick={onLogout}
            startIcon={<ExitIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Admin Functions
        </Typography>
        
        <Grid container spacing={3}>
          {adminCards.map((card) => (
            <Grid item xs={12} sm={6} md={6} key={card.title}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => handleCardClick(card.path)}
                  sx={{ height: '100%', p: 2 }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2
                      }}
                    >
                      <Box
                        sx={{
                          color: card.color,
                          mr: 2
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Typography variant="h5" component="div">
                        {card.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {card.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};


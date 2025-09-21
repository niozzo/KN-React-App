/**
 * Monitoring Dashboard Component
 * Real-time display of error monitoring and performance metrics
 * Story 2.1f: Enhanced Monitoring and Performance Tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { monitoringService, getHealthStatus, getPerformanceSummary, getErrorSummary, getCacheSummary } from '../services/monitoringService';

interface MonitoringDashboardProps {
  className?: string;
  refreshInterval?: number; // in milliseconds
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  className = '',
  refreshInterval = 5000 // 5 seconds
}) => {
  const [healthStatus, setHealthStatus] = useState(getHealthStatus());
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    performance: true,
    errors: true,
    cache: false
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setHealthStatus(getHealthStatus());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon />;
      case 'warning': return <WarningIcon />;
      case 'critical': return <ErrorIcon />;
      default: return <ErrorIcon />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Box className={`monitoring-dashboard ${className}`} sx={{ p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TimelineIcon />
        Monitoring Dashboard
      </Typography>

      {/* Overall Health Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="h2">
              System Health
            </Typography>
            <Chip
              icon={getStatusIcon(healthStatus.status)}
              label={healthStatus.status.toUpperCase()}
              color={getStatusColor(healthStatus.status) as any}
              variant="filled"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Last updated: {formatTimestamp(healthStatus.timestamp)}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedIcon />
                  Performance
                </Typography>
                <IconButton onClick={() => toggleSection('performance')}>
                  {expandedSections.performance ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.performance}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Response Time
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((healthStatus.performance.averageResponseTime / 1000) * 100, 100)}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="h6">
                    {formatDuration(healthStatus.performance.averageResponseTime)}
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Requests
                    </Typography>
                    <Typography variant="h6">
                      {healthStatus.performance.totalRequests}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Error Rate
                    </Typography>
                    <Typography variant="h6" color={healthStatus.performance.errorRate > 0.05 ? 'error.main' : 'text.primary'}>
                      {(healthStatus.performance.errorRate * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                </Grid>

                {healthStatus.performance.topSlowOperations.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Slowest Operations
                    </Typography>
                    <List dense>
                      {healthStatus.performance.topSlowOperations.slice(0, 3).map((op, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText
                            primary={op.name}
                            secondary={formatDuration(op.value)}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon />
                  Errors
                </Typography>
                <IconButton onClick={() => toggleSection('errors')}>
                  {expandedSections.errors ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.errors}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Errors
                    </Typography>
                    <Typography variant="h6" color={healthStatus.errors.totalErrors > 0 ? 'error.main' : 'text.primary'}>
                      {healthStatus.errors.totalErrors}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Critical
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {healthStatus.errors.errorsBySeverity.critical || 0}
                    </Typography>
                  </Grid>
                </Grid>

                {Object.keys(healthStatus.errors.errorsByComponent).length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Errors by Component
                    </Typography>
                    <List dense>
                      {Object.entries(healthStatus.errors.errorsByComponent)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 3)
                        .map(([component, count]) => (
                          <ListItem key={component} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={component}
                              secondary={`${count} errors`}
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Box>
                )}

                {healthStatus.errors.recentErrors.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Recent Errors
                    </Typography>
                    <List dense>
                      {healthStatus.errors.recentErrors.slice(0, 3).map((error, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon>
                            <ErrorIcon color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={error.message}
                            secondary={`${error.component || 'Unknown'} - ${formatTimestamp(error.timestamp)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>
        </Grid>

        {/* Cache Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MemoryIcon />
                  Cache Performance
                </Typography>
                <IconButton onClick={() => toggleSection('cache')}>
                  {expandedSections.cache ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.cache}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      Hit Rate
                    </Typography>
                    <Typography variant="h6" color={healthStatus.cache.hitRate > 0.8 ? 'success.main' : 'warning.main'}>
                      {(healthStatus.cache.hitRate * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Operations
                    </Typography>
                    <Typography variant="h6">
                      {healthStatus.cache.totalOperations}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      Avg Duration
                    </Typography>
                    <Typography variant="h6">
                      {formatDuration(healthStatus.cache.averageOperationTime)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {((healthStatus.cache.totalOperations - healthStatus.cache.recentOperations.filter(op => !op.success).length) / Math.max(healthStatus.cache.totalOperations, 1) * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                </Grid>

                {Object.keys(healthStatus.cache.operationsByType).length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Operations by Type
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Operation</TableCell>
                            <TableCell align="right">Count</TableCell>
                            <TableCell align="right">Success Rate</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(healthStatus.cache.operationsByType).map(([operation, count]) => {
                            const successCount = healthStatus.cache.recentOperations
                              .filter(op => op.operation === operation && op.success).length;
                            const successRate = (successCount / count) * 100;
                            
                            return (
                              <TableRow key={operation}>
                                <TableCell>{operation}</TableCell>
                                <TableCell align="right">{count}</TableCell>
                                <TableCell align="right" color={successRate > 90 ? 'success.main' : 'warning.main'}>
                                  {successRate.toFixed(1)}%
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MonitoringDashboard;

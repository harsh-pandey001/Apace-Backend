
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  Chip,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Send as SendIcon,
  History as HistoryIcon,
  PhoneAndroid as DeviceIcon,
  BugReport as TestIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import NotificationDashboard from '../components/notifications/NotificationDashboard';
import SendNotificationForm from '../components/notifications/SendNotificationForm';
import NotificationHistory from '../components/notifications/NotificationHistory';
import DeviceTokensManager from '../components/notifications/DeviceTokensManager';
import TestNotificationForm from '../components/notifications/TestNotificationForm';

import notificationService from '../services/notificationService';

const Notifications = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    loadServiceStatus();
  }, []);

  const loadServiceStatus = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getStatus();
      setServiceStatus(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load notification service status:', err);
      setError('Failed to load notification service status');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getServiceStatusIcon = () => {
    if (!serviceStatus) return <InfoIcon color="info" />;
    
    const fcmAvailable = serviceStatus.services?.fcm?.available;
    const dbConnected = serviceStatus.services?.database?.connected;
    
    if (fcmAvailable && dbConnected) {
      return <SuccessIcon color="success" />;
    } else if (fcmAvailable || dbConnected) {
      return <WarningIcon color="warning" />;
    } else {
      return <ErrorIcon color="error" />;
    }
  };

  const getServiceStatusText = () => {
    if (!serviceStatus) return 'Loading...';
    
    const fcmAvailable = serviceStatus.services?.fcm?.available;
    const dbConnected = serviceStatus.services?.database?.connected;
    
    if (fcmAvailable && dbConnected) {
      return 'All Systems Operational';
    } else if (fcmAvailable || dbConnected) {
      return 'Partial Service Available';
    } else {
      return 'Service Unavailable';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon />
          Notifications Management
        </Typography>
        
        {/* Service Status Banner */}
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
            borderLeft: `4px solid ${
              serviceStatus?.services?.fcm?.available && serviceStatus?.services?.database?.connected
                ? theme.palette.success.main
                : theme.palette.warning.main
            }`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getServiceStatusIcon()}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                {getServiceStatusText()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {serviceStatus && (
                  <>
                    FCM: {serviceStatus.services?.fcm?.available ? 'Connected' : 'Disconnected'} • 
                    Database: {serviceStatus.services?.database?.connected ? 'Connected' : 'Disconnected'} • 
                    Active Tokens: {serviceStatus.statistics?.activeDeviceTokens || 0}
                  </>
                )}
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={loadServiceStatus}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<InfoIcon />} 
            label="Dashboard" 
            iconPosition="start"
          />
          <Tab 
            icon={<SendIcon />} 
            label="Send Notifications" 
            iconPosition="start"
          />
          <Tab 
            icon={<TestIcon />} 
            label="Test & Debug" 
            iconPosition="start"
          />
          <Tab 
            icon={<HistoryIcon />} 
            label="History" 
            iconPosition="start"
          />
          <Tab 
            icon={<DeviceIcon />} 
            label="Device Tokens" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <Box>
        {activeTab === 0 && (
          <NotificationDashboard 
            serviceStatus={serviceStatus} 
            onRefresh={loadServiceStatus}
            showSnackbar={showSnackbar}
          />
        )}
        
        {activeTab === 1 && (
          <SendNotificationForm 
            showSnackbar={showSnackbar}
            onSuccess={() => {
              loadServiceStatus(); // Refresh statistics after sending
            }}
          />
        )}
        
        {activeTab === 2 && (
          <TestNotificationForm 
            showSnackbar={showSnackbar}
          />
        )}
        
        {activeTab === 3 && (
          <NotificationHistory 
            showSnackbar={showSnackbar}
          />
        )}
        
        {activeTab === 4 && (
          <DeviceTokensManager 
            showSnackbar={showSnackbar}
          />
        )}
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Notifications;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as SuccessIcon,
  Refresh as RefreshIcon,
  Storage as DatabaseIcon
} from '@mui/icons-material';
import axios from 'axios';


// Real service health with actual API calls
const RealServiceHealth = ({ onRefresh }) => {
  const [fcmStatus, setFcmStatus] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkServices = async () => {
    setLoading(true);
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'https://apace-backend-dev-86500976134.us-central1.run.app/api';
      
      // Check FCM status
      const fcmResponse = await axios.get(`${baseURL.replace('/api', '')}/health/fcm`);
      setFcmStatus(fcmResponse.data);
      
      // Check database status
      const dbResponse = await axios.get(`${baseURL.replace('/api', '')}/health/db`);
      setDbStatus(dbResponse.data);
    } catch (error) {
      console.error('Failed to check service status:', error);
      setFcmStatus({ status: 'error', fcm: { available: false, error: 'Connection failed' } });
      setDbStatus({ status: 'error', database: { connected: false, error: 'Connection failed' } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkServices();
  }, []);

  const handleRefresh = () => {
    checkServices();
    if (onRefresh) onRefresh();
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">System Status</Typography>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
        
        {loading && <CircularProgress size={24} sx={{ mb: 2 }} />}
        
        <List sx={{ p: 0 }}>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Firebase Cloud Messaging"
              secondary={fcmStatus?.fcm?.projectId || 'Checking...'}
            />
            <Chip 
              label={fcmStatus?.fcm?.available ? 'Connected' : 'Disconnected'}
              color={fcmStatus?.fcm?.available ? 'success' : 'error'}
              size="small"
            />
          </ListItem>
          
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <DatabaseIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Database Connection"
              secondary={dbStatus?.timestamp ? new Date(dbStatus.timestamp).toLocaleString() : 'Checking...'}
            />
            <Chip 
              label={dbStatus?.database?.connected ? 'Connected' : 'Disconnected'}
              color={dbStatus?.database?.connected ? 'success' : 'error'}
              size="small"
            />
          </ListItem>
        </List>
        
        {fcmStatus?.fcm?.error && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            FCM Error: {fcmStatus.fcm.error}
          </Alert>
        )}
        
        {dbStatus?.database?.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Database Error: {dbStatus.database.error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Automatic notification status info
const AutoNotificationInfo = () => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Automatic Notifications
        </Typography>
        
        <List sx={{ p: 0 }}>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <SuccessIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Booking Confirmations"
              secondary="Automatic on shipment creation"
            />
          </ListItem>
          
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <SuccessIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Driver Assignments"
              secondary="Automatic when driver assigned"
            />
          </ListItem>
          
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <SuccessIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Status Updates"
              secondary="Real-time shipment tracking"
            />
          </ListItem>
          
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <SuccessIcon color="success" />
            </ListItemIcon>
            <ListItemText 
              primary="Payment Reminders"
              secondary="Automatic retry system"
            />
          </ListItem>
        </List>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          All shipment notifications are fully automated. No manual intervention required.
        </Alert>
      </CardContent>
    </Card>
  );
};


const NotificationDashboard = ({ onRefresh }) => {
  return (
    <Box>
      <Grid container spacing={3}>
        {/* Real Service Status */}
        <Grid item xs={12} md={6}>
          <RealServiceHealth onRefresh={onRefresh} />
        </Grid>

        {/* Automatic Notification Info */}
        <Grid item xs={12} md={6}>
          <AutoNotificationInfo />
        </Grid>
        
        {/* System Info */}
        <Grid item xs={12}>
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              🎉 Notification System Status: Fully Automated
            </Typography>
            <Typography>
              All shipment-related notifications are automatically handled by the system. 
              Notifications are sent for booking confirmations, driver assignments, status updates, 
              payment reminders, and delivery confirmations without any manual intervention.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationDashboard;
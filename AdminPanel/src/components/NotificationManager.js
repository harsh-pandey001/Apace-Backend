import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  NotificationsActive as NotificationIcon,
  TestTube as TestIcon
} from '@mui/icons-material';
import notificationService from '../services/notificationService';

const NotificationManager = () => {
  const [notificationData, setNotificationData] = useState({
    userIds: '',
    driverIds: '',
    type: 'general',
    title: '',
    body: '',
    priority: 'normal',
    channels: ['push']
  });

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load notification service status
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setStatusLoading(true);
      const statusData = await notificationService.getStatus();
      setStatus(statusData.data);
    } catch (error) {
      console.error('Failed to load notification status:', error);
      setMessage({ type: 'error', text: 'Failed to load notification service status' });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNotificationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendNotification = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // Format data
      const formattedData = notificationService.formatNotificationData({
        ...notificationData,
        userIds: notificationData.userIds.split(',').map(id => id.trim()).filter(id => id),
        driverIds: notificationData.driverIds.split(',').map(id => id.trim()).filter(id => id)
      });

      // Validate data
      const errors = notificationService.validateNotificationData(formattedData);
      if (errors.length > 0) {
        setMessage({ type: 'error', text: errors.join(', ') });
        return;
      }

      // Send notification
      const result = await notificationService.sendNotification(formattedData);
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `Notification sent successfully: ${result.data.successCount} sent, ${result.data.failureCount} failed` 
        });
        
        // Reset form for general notifications
        if (notificationData.type === 'general') {
          setNotificationData({
            ...notificationData,
            title: '',
            body: ''
          });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to send notification' });
      }

    } catch (error) {
      console.error('Send notification error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to send notification' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestNotification = async (userId = null, driverId = null) => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const result = await notificationService.sendTestNotification(userId, driverId);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Test notification sent successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to send test notification' });
      }

    } catch (error) {
      console.error('Test notification error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to send test notification' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <NotificationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Notification Management
      </Typography>

      {/* Service Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Service Status</Typography>
          {statusLoading ? (
            <CircularProgress size={24} />
          ) : status ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  <strong>FCM Status:</strong>{' '}
                  <Chip 
                    label={status.services.fcm.available ? 'Available' : 'Disabled'}
                    color={status.services.fcm.available ? 'success' : 'default'}
                    size="small"
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  <strong>Active Tokens:</strong> {status.stats.activeTokens}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2">
                  <strong>Total Notifications:</strong> {status.stats.totalNotifications}
                </Typography>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="warning">Unable to load service status</Alert>
          )}
          
          <Button 
            onClick={loadStatus} 
            size="small" 
            sx={{ mt: 1 }}
            disabled={statusLoading}
          >
            Refresh Status
          </Button>
        </CardContent>
      </Card>

      {/* Message Alert */}
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Send Notification Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Send Notification</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="User IDs (comma separated)"
                  value={notificationData.userIds}
                  onChange={(e) => handleInputChange('userIds', e.target.value)}
                  placeholder="1, 2, 3"
                  helperText="Enter user IDs to notify customers"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Driver IDs (comma separated)"
                  value={notificationData.driverIds}
                  onChange={(e) => handleInputChange('driverIds', e.target.value)}
                  placeholder="1, 2, 3"
                  helperText="Enter driver IDs to notify drivers"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Notification Type</InputLabel>
                  <Select
                    value={notificationData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                  >
                    {notificationService.getNotificationTypes().map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={notificationData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  >
                    {notificationService.getPriorityOptions().map(priority => (
                      <MenuItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {notificationData.type === 'general' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={notificationData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message Body"
                      value={notificationData.body}
                      onChange={(e) => handleInputChange('body', e.target.value)}
                      multiline
                      rows={3}
                      required
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleSendNotification}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  fullWidth
                >
                  {loading ? 'Sending...' : 'Send Notification'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Test Notifications */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Test Notifications</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Test User ID"
                type="number"
                size="small"
                id="test-user-id"
              />
              
              <Button
                variant="outlined"
                onClick={() => {
                  const userId = document.getElementById('test-user-id').value;
                  if (userId) handleSendTestNotification(parseInt(userId));
                }}
                disabled={loading}
                startIcon={<TestIcon />}
              >
                Test User Notification
              </Button>

              <Divider />

              <TextField
                label="Test Driver ID"
                type="number"
                size="small"
                id="test-driver-id"
              />
              
              <Button
                variant="outlined"
                onClick={() => {
                  const driverId = document.getElementById('test-driver-id').value;
                  if (driverId) handleSendTestNotification(null, parseInt(driverId));
                }}
                disabled={loading}
                startIcon={<TestIcon />}
              >
                Test Driver Notification
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationManager;
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  BugReport as TestIcon,
  Send as SendIcon,
  Person as PersonIcon,
  DriveEta as DriverIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Devices as DevicesIcon
} from '@mui/icons-material';

import axios from 'axios';

const TestNotificationForm = ({ showSnackbar }) => {
  const [formData, setFormData] = useState({
    recipientType: 'user',
    recipientId: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    // Clear previous results and errors
    setResult(null);
    setError('');
  };

  const validateForm = () => {
    if (!formData.recipientId.trim()) {
      setError('Recipient ID is required');
      return false;
    }
    
    // Basic UUID validation (optional but helpful)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(formData.recipientId.trim())) {
      setError('Please enter a valid UUID format');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      
      const requestData = formData.recipientType === 'user' 
        ? { userId: formData.recipientId.trim() }
        : { driverId: formData.recipientId.trim() };
      
      const baseURL = process.env.REACT_APP_API_URL || 'https://apace-backend-dev-86500976134.us-central1.run.app/api';
      const token = localStorage.getItem('auth_token');
      
      const response = await axios.post(`${baseURL}/notifications/test`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setResult(response.data);
      showSnackbar('Test notification sent successfully!', 'success');
      
    } catch (error) {
      console.error('Failed to send test notification:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send test notification';
      setError(errorMessage);
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      recipientType: 'user',
      recipientId: ''
    });
    setResult(null);
    setError('');
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Test Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TestIcon />
              Send Test Notification
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Send a test notification to verify delivery and debug any issues.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend">Recipient Type</FormLabel>
                    <RadioGroup
                      value={formData.recipientType}
                      onChange={handleInputChange('recipientType')}
                      row
                    >
                      <FormControlLabel
                        value="user"
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" />
                            User
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="driver"
                        control={<Radio />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DriverIcon fontSize="small" />
                            Driver
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label={`${formData.recipientType === 'user' ? 'User' : 'Driver'} ID`}
                    placeholder="Enter UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                    value={formData.recipientId}
                    onChange={handleInputChange('recipientId')}
                    helperText="Enter the UUID of the user or driver to send a test notification"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleClear}
                      disabled={loading}
                    >
                      Clear
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                      disabled={loading || !formData.recipientId.trim()}
                      sx={{ flexGrow: 1 }}
                    >
                      {loading ? 'Sending Test...' : 'Send Test Notification'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Test Results */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Test Results
            </Typography>
            
            {result ? (
              <Box>
                {/* Test Result Summary */}
                <Card sx={{ mb: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Test Notification Result
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {result.success ? 
                        <SuccessIcon color="success" /> : 
                        <ErrorIcon color="error" />
                      }
                      <Chip 
                        label={result.success ? 'SUCCESS' : 'FAILED'}
                        color={result.success ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    
                    {result.message && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {result.message}
                      </Typography>
                    )}
                    
                    {result.recipientType && (
                      <Typography variant="body2" color="textSecondary">
                        Sent to: {result.recipientType} (ID: {result.recipientId})
                      </Typography>
                    )}
                    
                    {result.timestamp && (
                      <Typography variant="body2" color="textSecondary">
                        Timestamp: {new Date(result.timestamp).toLocaleString()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
                
                {/* FCM Response */}
                {result.fcmResponse && (
                  <Card sx={{ mb: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        FCM Response
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                        {JSON.stringify(result.fcmResponse, null, 2)}
                      </Typography>
                    </CardContent>
                  </Card>
                )}
                
                {/* Error Details */}
                {result.error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2">Error Details:</Typography>
                    <Typography variant="body2">{result.error}</Typography>
                  </Alert>
                )}
              </Box>
            ) : error ? (
              <Alert severity="error">
                <Typography variant="subtitle2">Test Failed:</Typography>
                <Typography variant="body2">{error}</Typography>
              </Alert>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                  Enter a User ID or Driver ID above and click "Send Test Notification" to test the FCM notification system.
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  This will send a real test notification if FCM is properly configured.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestNotificationForm;
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Grid,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';

import axios from 'axios';

const SendNotificationForm = ({ showSnackbar, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    body: '',
    userIds: [],
    driverIds: [],
    priority: 'normal',
    channels: ['push'],
    data: {}
  });

  const [userInput, setUserInput] = useState('');
  const [driverInput, setDriverInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    recipients: true,
    content: true,
    options: false
  });

  // Real notification types for manual admin communications only
  const notificationTypes = [
    { value: 'system_announcement', label: 'System Announcement' },
    { value: 'service_update', label: 'Service Update' },
    { value: 'emergency_alert', label: 'Emergency Alert' },
    { value: 'maintenance_notice', label: 'Maintenance Notice' }
  ];
  
  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];
  
  const channelOptions = [
    { value: 'push', label: 'Push Notification' }
  ];

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleChannelChange = (channel) => (event) => {
    const checked = event.target.checked;
    setFormData(prev => ({
      ...prev,
      channels: checked 
        ? [...prev.channels, channel]
        : prev.channels.filter(c => c !== channel)
    }));
  };

  const handleAddUserId = () => {
    if (userInput.trim() && !formData.userIds.includes(userInput.trim())) {
      setFormData(prev => ({
        ...prev,
        userIds: [...prev.userIds, userInput.trim()]
      }));
      setUserInput('');
    }
  };

  const handleAddDriverId = () => {
    if (driverInput.trim() && !formData.driverIds.includes(driverInput.trim())) {
      setFormData(prev => ({
        ...prev,
        driverIds: [...prev.driverIds, driverInput.trim()]
      }));
      setDriverInput('');
    }
  };

  const handleRemoveUserId = (userId) => {
    setFormData(prev => ({
      ...prev,
      userIds: prev.userIds.filter(id => id !== userId)
    }));
  };

  const handleRemoveDriverId = (driverId) => {
    setFormData(prev => ({
      ...prev,
      driverIds: prev.driverIds.filter(id => id !== driverId)
    }));
  };

  const handleSectionToggle = (section) => (event, isExpanded) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: isExpanded
    }));
  };

  const validateForm = () => {
    const validationErrors = [];
    
    // Basic form validations
    if (!formData.type.trim()) {
      validationErrors.push('Notification type is required');
    }
    
    // Validate title and body for all notification types
    if (formData.type && !formData.title.trim()) {
      validationErrors.push('Title is required');
    }
    
    if (formData.type && !formData.body.trim()) {
      validationErrors.push('Message body is required');
    }
    
    if (formData.userIds.length === 0 && formData.driverIds.length === 0) {
      validationErrors.push('At least one recipient (User ID or Driver ID) is required');
    }
    
    // Validate UUID format for user IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    formData.userIds.forEach((userId, index) => {
      if (!uuidRegex.test(userId)) {
        validationErrors.push(`User ID ${index + 1} is not a valid UUID format`);
      }
    });
    
    formData.driverIds.forEach((driverId, index) => {
      if (!uuidRegex.test(driverId)) {
        validationErrors.push(`Driver ID ${index + 1} is not a valid UUID format`);
      }
    });
    
    // Channel validation
    if (formData.channels.length === 0) {
      validationErrors.push('At least one notification channel must be selected');
    }

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      showSnackbar('Please fix the form errors before submitting', 'error');
      return;
    }

    try {
      setLoading(true);
      
      const baseURL = process.env.REACT_APP_API_URL || 'https://apace-backend-dev-86500976134.us-central1.run.app/api';
      const token = localStorage.getItem('auth_token');
      
      // Prepare notification data for real API
      const notificationData = {
        type: formData.type,
        title: formData.title,
        body: formData.body,
        userIds: formData.userIds,
        driverIds: formData.driverIds,
        priority: formData.priority,
        data: formData.data
      };
      
      const response = await axios.post(`${baseURL}/notifications/send`, notificationData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const { successful, failed, total } = response.data.data;
      
      if (successful > 0) {
        showSnackbar(
          `Successfully sent ${successful}/${total} notifications${failed > 0 ? `, ${failed} failed` : ''}`,
          failed > 0 ? 'warning' : 'success'
        );
        
        handleClearForm();
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showSnackbar('Failed to send any notifications', 'error');
      }
      
    } catch (error) {
      console.error('Failed to send notification:', error);
      showSnackbar(
        error.response?.data?.message || 'Failed to send notification',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      type: '',
      title: '',
      body: '',
      userIds: [],
      driverIds: [],
      priority: 'normal',
      channels: ['push'],
      data: {}
    });
    setUserInput('');
    setDriverInput('');
    setErrors([]);
  };


  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SendIcon />
          Send Notifications
        </Typography>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Please fix the following errors:</Typography>
            <List dense>
              {errors.map((error, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText primary={`• ${error}`} />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* Recipients Section */}
          <Accordion 
            expanded={expandedSections.recipients}
            onChange={handleSectionToggle('recipients')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Recipients ({formData.userIds.length + formData.driverIds.length} selected)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>User IDs</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter User ID"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddUserId();
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddUserId}
                      disabled={!userInput.trim()}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.userIds.map((userId) => (
                      <Chip
                        key={userId}
                        label={userId}
                        onDelete={() => handleRemoveUserId(userId)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Driver IDs</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter Driver ID"
                      value={driverInput}
                      onChange={(e) => setDriverInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDriverId();
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddDriverId}
                      disabled={!driverInput.trim()}
                      startIcon={<AddIcon />}
                    >
                      Add
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.driverIds.map((driverId) => (
                      <Chip
                        key={driverId}
                        label={driverId}
                        onDelete={() => handleRemoveDriverId(driverId)}
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Content Section */}
          <Accordion 
            expanded={expandedSections.content}
            onChange={handleSectionToggle('content')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Notification Content</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Notification Type</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={handleInputChange('type')}
                      label="Notification Type"
                    >
                      {notificationTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {formData.type && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        label="Title"
                        value={formData.title}
                        onChange={handleInputChange('title')}
                        inputProps={{ maxLength: 255 }}
                        helperText={`${formData.title.length}/255 characters`}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        multiline
                        rows={4}
                        label="Message Body"
                        value={formData.body}
                        onChange={handleInputChange('body')}
                        inputProps={{ maxLength: 1000 }}
                        helperText={`${formData.body.length}/1000 characters`}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Options Section */}
          <Accordion 
            expanded={expandedSections.options}
            onChange={handleSectionToggle('options')}
            sx={{ mb: 3 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Advanced Options</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      onChange={handleInputChange('priority')}
                      label="Priority"
                    >
                      {priorityOptions.map((priority) => (
                        <MenuItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Notification Channels
                  </Typography>
                  <FormGroup>
                    {channelOptions.map((channel) => (
                      <FormControlLabel
                        key={channel.value}
                        control={
                          <Checkbox
                            checked={formData.channels.includes(channel.value)}
                            onChange={handleChannelChange(channel.value)}
                            disabled={channel.value !== 'push'} // Only push notifications are currently supported
                          />
                        }
                        label={channel.label}
                      />
                    ))}
                  </FormGroup>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleClearForm}
              startIcon={<ClearIcon />}
              disabled={loading}
            >
              Clear Form
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setPreviewOpen(!previewOpen)}
              startIcon={<PreviewIcon />}
              disabled={loading}
            >
              Preview
            </Button>

            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
              disabled={loading || (formData.userIds.length === 0 && formData.driverIds.length === 0)}
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </Button>
          </Box>

          {/* Preview Section */}
          {previewOpen && (
            <Paper sx={{ mt: 3, p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Preview</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Type:</Typography>
                  <Typography>{formData.type || 'Not selected'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Priority:</Typography>
                  <Typography>{formData.priority}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Recipients:</Typography>
                  <Typography>{formData.userIds.length + formData.driverIds.length} selected</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Channels:</Typography>
                  <Typography>{formData.channels.join(', ')}</Typography>
                </Grid>
                {formData.title && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Title:</Typography>
                    <Typography>{formData.title}</Typography>
                  </Grid>
                )}
                {formData.body && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Body:</Typography>
                    <Typography>{formData.body}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SendNotificationForm;
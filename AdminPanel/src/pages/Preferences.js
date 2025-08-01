import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';

function Preferences() {
  const [preferences, setPreferences] = React.useState({
    emailNotifications: true,
    pushNotifications: false,
    autoAssignDrivers: true,
    maintenanceMode: false,
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
  });

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setPreferences({
      ...preferences,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSave = () => {
    alert('Preferences saved successfully!');
  };

  const handleReset = () => {
    alert('Preferences reset to defaults!');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Preferences
      </Typography>
      
      <Grid container spacing={3}>
        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.emailNotifications}
                  onChange={handleChange}
                  name="emailNotifications"
                />
              }
              label="Email Notifications"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.pushNotifications}
                  onChange={handleChange}
                  name="pushNotifications"
                />
              }
              label="Push Notifications"
            />
          </Paper>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.autoAssignDrivers}
                  onChange={handleChange}
                  name="autoAssignDrivers"
                />
              }
              label="Auto-assign Drivers"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.maintenanceMode}
                  onChange={handleChange}
                  name="maintenanceMode"
                  color="warning"
                />
              }
              label="Maintenance Mode"
            />
          </Paper>
        </Grid>

        {/* Display Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Display Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Theme</InputLabel>
              <Select
                name="theme"
                value={preferences.theme}
                onChange={handleChange}
                label="Theme"
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="auto">Auto</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Language</InputLabel>
              <Select
                name="language"
                value={preferences.language}
                onChange={handleChange}
                label="Language"
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        {/* Regional Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Regional Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Timezone</InputLabel>
              <Select
                name="timezone"
                value={preferences.timezone}
                onChange={handleChange}
                label="Timezone"
              >
                <MenuItem value="UTC">UTC</MenuItem>
                <MenuItem value="EST">Eastern Time</MenuItem>
                <MenuItem value="PST">Pacific Time</MenuItem>
                <MenuItem value="CST">Central Time</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Date Format"
              defaultValue="MM/DD/YYYY"
              sx={{ mb: 2 }}
            />
          </Paper>
        </Grid>

        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={handleReset}
            >
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Preferences;
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Close as CloseIcon,
  DirectionsCar as CarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  VerifiedUser as VerifiedUserIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import driverService from '../services/driverService';

const DriverDetailsModal = ({ open, driverId, onClose }) => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch driver details when modal opens
  useEffect(() => {
    if (open && driverId) {
      fetchDriverDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, driverId]);

  const fetchDriverDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await driverService.getDriverById(driverId);
      setDriver(response.data.driver);
    } catch (err) {
      console.error('Error fetching driver details:', err);
      setError('Failed to load driver details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDriver(null);
    setError(null);
    onClose();
  };

  const getVehicleTypeColor = (vehicleType) => {
    const typeColors = {
      'bike': '#2196f3',
      'motorcycle': '#2196f3',
      'car': '#4caf50',
      'van': '#ff9800',
      'truck': '#f44336',
      'mini_truck': '#ff5722',
      'pickup': '#795548'
    };
    return typeColors[vehicleType?.toLowerCase()] || '#9e9e9e';
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="driver-details-title"
    >
      <DialogTitle
        id="driver-details-title"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'primary.contrastText'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CarIcon sx={{ mr: 1 }} />
          Driver Details
        </Box>
        <Button
          onClick={handleClose}
          size="small"
          sx={{ color: 'primary.contrastText', minWidth: 'auto' }}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button 
              color="inherit" 
              size="small" 
              sx={{ ml: 2 }}
              onClick={fetchDriverDetails}
            >
              Retry
            </Button>
          </Alert>
        ) : driver ? (
          <Grid container spacing={3}>
            {/* Driver Basic Info */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: getVehicleTypeColor(driver.vehicleType),
                    mr: 2
                  }}
                >
                  <CarIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {driver.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={driver.isActive ? <VerifiedUserIcon /> : <PendingIcon />}
                      label={driver.isActive ? 'Active' : 'Inactive'}
                      color={driver.isActive ? 'success' : 'error'}
                      size="small"
                    />
                    <Chip
                      icon={driver.isVerified ? <VerifiedUserIcon /> : <PendingIcon />}
                      label={driver.isVerified ? 'Verified' : 'Pending Verification'}
                      color={driver.isVerified ? 'success' : 'warning'}
                      size="small"
                    />
                    <Chip
                      label={driver.availability_status || 'offline'}
                      color={driver.availability_status === 'online' ? 'success' : 'default'}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Contact Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <EmailIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ ml: 3 }}>
                  {driver.email}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PhoneIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ ml: 3 }}>
                  {driver.phone}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Registration Date
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ ml: 3 }}>
                  {formatDate(driver.createdAt)}
                </Typography>
              </Box>
            </Grid>

            {/* Vehicle Information */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom color="primary">
                <CarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Vehicle Information
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Vehicle Type
                </Typography>
                <Chip
                  label={driver.vehicleType}
                  sx={{
                    bgcolor: getVehicleTypeColor(driver.vehicleType),
                    color: 'white',
                    textTransform: 'capitalize'
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Vehicle Number
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>
                  {driver.vehicleNumber}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Vehicle Capacity
                </Typography>
                <Typography variant="body1">
                  {driver.vehicleCapacity}
                </Typography>
              </Box>
            </Grid>

            {/* Additional Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom color="primary">
                System Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Driver ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {driver.id}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {driver.updatedAt ? formatDate(driver.updatedAt) : 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Account Status
                  </Typography>
                  <Typography variant="body2">
                    {driver.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Verification Status
                  </Typography>
                  <Typography variant="body2">
                    {driver.isVerified ? 'Verified' : 'Pending'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No driver data available.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

DriverDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  driverId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default DriverDetailsModal;
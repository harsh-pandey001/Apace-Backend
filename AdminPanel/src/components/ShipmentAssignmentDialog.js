import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  Chip
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicleService';
// Removed MUI X Date Pickers due to compatibility issues
// Using native HTML5 datetime-local input instead

function ShipmentAssignmentDialog({ 
  open, 
  onClose, 
  shipment,
  onAssign,
  loading = false 
}) {
  // Helper function to format date for datetime-local input
  const formatDateTimeLocal = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    driverId: '',
    estimatedDeliveryDate: formatDateTimeLocal(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // Reset form when dialog opens/closes and fetch available drivers
  useEffect(() => {
    if (open && shipment?.vehicleType) {
      setFormData({
        driverId: '',
        estimatedDeliveryDate: formatDateTimeLocal(Date.now() + 24 * 60 * 60 * 1000),
        notes: ''
      });
      setErrors({});
      fetchAvailableDrivers(shipment.vehicleType);
    }
  }, [open, shipment]);

  // Fetch available drivers based on vehicle type
  const fetchAvailableDrivers = async (vehicleType) => {
    setLoadingDrivers(true);
    try {
      const response = await vehicleService.getAvailableDriversByVehicleType(vehicleType);
      setAvailableDrivers(response.data.drivers || []);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      setAvailableDrivers([]);
      setErrors(prev => ({
        ...prev,
        general: 'Failed to load available drivers. Please try again.'
      }));
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.driverId) {
      newErrors.driverId = 'Please select a driver';
    }

    if (!formData.estimatedDeliveryDate) {
      newErrors.estimatedDeliveryDate = 'Please select an estimated delivery date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const assignmentData = {
      driverId: formData.driverId,
      estimatedDeliveryDate: new Date(formData.estimatedDeliveryDate).toISOString(),
      notes: formData.notes || undefined
    };

    onAssign(assignmentData);
  };

  const selectedDriver = availableDrivers.find(d => d.id === formData.driverId);

  return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="assignment-dialog-title"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon color="primary" />
          Assign Shipment
        </DialogTitle>

        <DialogContent>
          {shipment && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Shipment:</strong> {shipment.trackingNumber} | 
                <strong> Vehicle Type:</strong> {shipment.vehicleType} | 
                <strong> From:</strong> {shipment.pickupAddress} | 
                <strong> To:</strong> {shipment.deliveryAddress}
              </Typography>
            </Alert>
          )}

          {errors.general && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.general}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Driver Selection */}
            <Grid item xs={12} md={6}>
              {loadingDrivers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 2 }}>Loading available drivers...</Typography>
                </Box>
              ) : availableDrivers.length === 0 ? (
                <Alert severity="warning">
                  <Typography variant="body2">
                    No verified drivers available for vehicle type: <strong>{shipment?.vehicleType}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Only drivers with verified documents and matching vehicle type can be assigned.
                  </Typography>
                </Alert>
              ) : (
                <FormControl fullWidth error={!!errors.driverId}>
                  <InputLabel>Select Driver *</InputLabel>
                  <Select
                    value={formData.driverId}
                    onChange={(e) => handleInputChange('driverId', e.target.value)}
                    label="Select Driver *"
                    startAdornment={<PersonIcon color="action" sx={{ mr: 1 }} />}
                  >
                    {availableDrivers.map((driver) => (
                      <MenuItem 
                        key={driver.id} 
                        value={driver.id}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1, 
                          width: '100%'
                        }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1">
                              {driver.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {driver.email} • {driver.phone}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Vehicle: {driver.vehicleNumber} ({driver.vehicleType})
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip 
                              label={driver.availability_status} 
                              color="success" 
                              size="small" 
                            />
                            <Chip 
                              label={driver.documentsStatus} 
                              color="success" 
                              size="small" 
                            />
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.driverId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.driverId}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Showing only verified drivers with {shipment?.vehicleType} vehicles
                  </Typography>
                </FormControl>
              )}

              {selectedDriver && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Selected Driver & Vehicle</Typography>
                  <Typography variant="body2"><strong>Driver:</strong> {selectedDriver.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedDriver.email} • {selectedDriver.phone}</Typography>
                  <Typography variant="body2"><strong>Vehicle:</strong> {selectedDriver.vehicleNumber}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedDriver.vehicleType} • Capacity: {selectedDriver.vehicleCapacity}</Typography>
                </Box>
              )}
            </Grid>

            {/* Assignment Instructions */}
            <Grid item xs={12} md={6}>
              <Alert severity="info">
                <Typography variant="body2" gutterBottom>
                  <strong>New Assignment Process:</strong>
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>Select a driver → Vehicle is automatically assigned</li>
                  <li>Only verified drivers with matching vehicle type are shown</li>
                  <li>No manual vehicle selection needed</li>
                </Typography>
              </Alert>
            </Grid>

            {/* Estimated Delivery Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Estimated Delivery Date *"
                type="datetime-local"
                value={formData.estimatedDeliveryDate}
                onChange={(e) => handleInputChange('estimatedDeliveryDate', e.target.value)}
                error={!!errors.estimatedDeliveryDate}
                helperText={errors.estimatedDeliveryDate}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: formatDateTimeLocal(new Date())
                }}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Assignment Notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Please contact the customer before delivery. Fragile items inside."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.driverId || availableDrivers.length === 0}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AssignmentIcon />}
          >
            {loading ? 'Assigning...' : 'Assign to Driver'}
          </Button>
        </DialogActions>
      </Dialog>
  );
}

export default ShipmentAssignmentDialog;
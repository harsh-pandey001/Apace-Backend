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
  Person as PersonIcon,
  DirectionsCar as VehicleIcon
} from '@mui/icons-material';
// Removed MUI X Date Pickers due to compatibility issues
// Using native HTML5 datetime-local input instead

function ShipmentAssignmentDialog({ 
  open, 
  onClose, 
  shipment,
  drivers = [],
  vehicles = [],
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
    vehicleId: '',
    estimatedDeliveryDate: formatDateTimeLocal(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        driverId: '',
        vehicleId: '',
        estimatedDeliveryDate: formatDateTimeLocal(Date.now() + 24 * 60 * 60 * 1000),
        notes: ''
      });
      setErrors({});
    }
  }, [open]);

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

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Please select a vehicle';
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
      vehicleId: formData.vehicleId,
      estimatedDeliveryDate: new Date(formData.estimatedDeliveryDate).toISOString(),
      notes: formData.notes || undefined
    };

    onAssign(assignmentData);
  };

  const selectedDriver = drivers.find(d => d.id === formData.driverId);
  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

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
                <strong> From:</strong> {shipment.pickupAddress} | 
                <strong> To:</strong> {shipment.deliveryAddress}
              </Typography>
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Driver Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.driverId}>
                <InputLabel>Select Driver *</InputLabel>
                <Select
                  value={formData.driverId}
                  onChange={(e) => handleInputChange('driverId', e.target.value)}
                  label="Select Driver *"
                  startAdornment={<PersonIcon color="action" sx={{ mr: 1 }} />}
                >
                  {drivers.map((driver) => {
                    const isOffline = driver.availability_status !== 'online';
                    return (
                      <MenuItem 
                        key={driver.id} 
                        value={driver.id}
                        disabled={isOffline}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1, 
                          width: '100%',
                          opacity: isOffline ? 0.5 : 1
                        }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" color={isOffline ? 'text.disabled' : 'inherit'}>
                              {driver.firstName} {driver.lastName}
                              {isOffline && ' (Unavailable)'}
                            </Typography>
                            <Typography variant="body2" color={isOffline ? 'text.disabled' : 'text.secondary'}>
                              {driver.email} • {driver.phone}
                            </Typography>
                          </Box>
                          <Chip 
                            label={driver.availability_status || 'offline'} 
                            color={driver.availability_status === 'online' ? 'success' : 'default'} 
                            size="small" 
                          />
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
                {errors.driverId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.driverId}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Only online drivers can be assigned to shipments
                </Typography>
              </FormControl>

              {selectedDriver && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Selected Driver</Typography>
                  <Typography variant="body2">{selectedDriver.firstName} {selectedDriver.lastName}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedDriver.email}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedDriver.phone}</Typography>
                </Box>
              )}
            </Grid>

            {/* Vehicle Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.vehicleId}>
                <InputLabel>Select Vehicle *</InputLabel>
                <Select
                  value={formData.vehicleId}
                  onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                  label="Select Vehicle *"
                  startAdornment={<VehicleIcon color="action" sx={{ mr: 1 }} />}
                >
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1">
                            {vehicle.vehicleNumber} - {vehicle.model}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {vehicle.type} • {vehicle.licensePlate}
                            {vehicle.capacity && ` • ${vehicle.capacity}m³`}
                            {vehicle.maxWeight && ` • ${vehicle.maxWeight}kg`}
                          </Typography>
                        </Box>
                        <Chip 
                          label={vehicle.status || 'available'} 
                          color={vehicle.status === 'available' ? 'success' : 'default'} 
                          size="small" 
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.vehicleId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.vehicleId}
                  </Typography>
                )}
              </FormControl>

              {selectedVehicle && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>Selected Vehicle</Typography>
                  <Typography variant="body2">{selectedVehicle.vehicleNumber} - {selectedVehicle.model}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedVehicle.type} • {selectedVehicle.licensePlate}</Typography>
                  {selectedVehicle.capacity && (
                    <Typography variant="body2" color="text.secondary">Capacity: {selectedVehicle.capacity}m³</Typography>
                  )}
                  {selectedVehicle.maxWeight && (
                    <Typography variant="body2" color="text.secondary">Max Weight: {selectedVehicle.maxWeight}kg</Typography>
                  )}
                </Box>
              )}
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
            disabled={loading || !formData.driverId || !formData.vehicleId}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AssignmentIcon />}
          >
            {loading ? 'Assigning...' : 'Assign Shipment'}
          </Button>
        </DialogActions>
      </Dialog>
  );
}

export default ShipmentAssignmentDialog;
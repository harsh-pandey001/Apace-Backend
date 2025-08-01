import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  DirectionsCar as VehicleIcon,
  LocalShipping as TrackingIcon,
  Schedule as ScheduleIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { formatDate } from '../services/shipmentService';

function ShipmentAssignmentSuccessModal({ 
  open, 
  onClose, 
  assignmentData,
  onGoToShipment 
}) {
  if (!assignmentData) return null;

  const { shipment, driver, vehicle } = assignmentData;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="assignment-success-dialog"
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 32 }} />
          <Typography variant="h5" component="span">
            Shipment Assigned Successfully
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Shipment Information */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrackingIcon color="primary" />
                  Shipment Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="body1">
                    <strong>Tracking ID:</strong> {shipment?.trackingNumber}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Status:</strong>{' '}
                    <Chip 
                      label={shipment?.status || 'Assigned'} 
                      color="info" 
                      size="small" 
                    />
                  </Typography>
                  {shipment?.estimatedDeliveryDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="body1">
                        <strong>Estimated Delivery:</strong> {formatDate(shipment.estimatedDeliveryDate)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Driver Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon color="primary" />
                  Assigned Driver
                </Typography>
                {driver ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body1">
                      <strong>Name:</strong> {driver.firstName} {driver.lastName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body1">{driver.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body1">{driver.phone}</Typography>
                    </Box>
                    {driver.availability_status && (
                      <Typography variant="body1">
                        <strong>Status:</strong>{' '}
                        <Chip 
                          label={driver.availability_status} 
                          color={driver.availability_status === 'online' ? 'success' : 'default'} 
                          size="small" 
                        />
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No driver information available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Vehicle Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VehicleIcon color="primary" />
                  Assigned Vehicle
                </Typography>
                {vehicle ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body1">
                      <strong>Vehicle Number:</strong> {vehicle.vehicleNumber}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Type:</strong> {vehicle.type}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Model:</strong> {vehicle.model}
                    </Typography>
                    <Typography variant="body1">
                      <strong>License Plate:</strong> {vehicle.licensePlate}
                    </Typography>
                    {vehicle.capacity && (
                      <Typography variant="body1">
                        <strong>Capacity:</strong> {vehicle.capacity} m³
                      </Typography>
                    )}
                    {vehicle.maxWeight && (
                      <Typography variant="body1">
                        <strong>Max Weight:</strong> {vehicle.maxWeight} kg
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No vehicle information available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Assignment Notes */}
          {shipment?.notes && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotesIcon color="primary" />
                    Assignment Notes
                  </Typography>
                  <Typography variant="body1">
                    {shipment.notes}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Button 
          onClick={onClose}
          variant="outlined"
        >
          Dismiss
        </Button>
        <Button
          onClick={() => {
            if (onGoToShipment && shipment?.id) {
              onGoToShipment(shipment.id);
            }
            onClose();
          }}
          variant="contained"
          color="primary"
        >
          Go to Shipment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ShipmentAssignmentSuccessModal;
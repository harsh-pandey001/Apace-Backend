import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Typography,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Skeleton,
  Paper,
  Tooltip,
  Tab,
  Tabs
} from '@mui/material';
import {
  Close as CloseIcon,
  LocalShipping as ShippingIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Inventory as InventoryIcon,
  Payments as PaymentsIcon,
  Print as PrintIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { getAdminShipmentDetails, formatDate } from '../services/shipmentService';
import { useReactToPrint } from 'react-to-print';

/**
 * ShipmentDetailsModal component displays comprehensive information about a shipment
 */
const ShipmentDetailsModal = ({ open, shipmentId, onClose }) => {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Reference for the printable content
  const printRef = useRef();

  // Fetch shipment details when the modal opens and a shipmentId is provided
  useEffect(() => {
    if (open && shipmentId) {
      fetchShipmentDetails(shipmentId);
    }
  }, [open, shipmentId]);

  // Function to fetch shipment details
  const fetchShipmentDetails = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAdminShipmentDetails(id);
      setShipment(response.data.shipment);
    } catch (err) {
      console.error('Error fetching shipment details:', err);
      
      if (err.response && err.response.status === 404) {
        setError('Shipment not found. The shipment may have been deleted.');
      } else {
        setError('Failed to load shipment details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Get status color for chip display
  const getStatusColor = (status) => {
    if (!status) return 'default';
    
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'in_transit':
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    if (!status) return 'default';
    
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Shipment_${shipment?.trackingNumber || 'Details'}`,
    onAfterPrint: () => {
      setSnackbar({
        open: true,
        message: 'Shipment details printed successfully',
        severity: 'success',
      });
    },
  });

  // Handle closing the snackbar
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle modal close event
  const handleClose = () => {
    setShipment(null);
    setError(null);
    setTabValue(0);
    onClose();
  };

  // Loading skeleton
  if (loading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ShippingIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Shipment Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ p: 2 }}>
            <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Grid item xs={12} sm={6} key={item}>
                  <Skeleton variant="text" height={30} />
                  <Skeleton variant="text" width="80%" />
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        aria-labelledby="shipment-details-title"
      >
        <DialogTitle id="shipment-details-title" sx={{ m: 0, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ShippingIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="span">
              Shipment Details
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          ) : shipment ? (
            <Box ref={printRef} sx={{ p: 1 }}>
              {/* Header with Tracking Number and Status */}
              <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tracking Number
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {shipment.trackingNumber}
                    </Typography>
                  </Box>
                  <Chip
                    label={shipment.status}
                    color={getStatusColor(shipment.status)}
                    sx={{ textTransform: 'uppercase', fontWeight: 'bold', mt: { xs: 1, sm: 0 } }}
                  />
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      Created: {formatDate(shipment.createdAt)}
                    </Typography>
                  </Box>
                  <Tooltip title="Print Shipment Details">
                    <IconButton onClick={handlePrint} size="small">
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
              
              {/* Tabs Navigation */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="shipment details tabs">
                  <Tab label="Shipment Info" icon={<InfoIcon />} iconPosition="start" />
                  <Tab label="User Details" icon={<PersonIcon />} iconPosition="start" />
                </Tabs>
              </Box>
              
              {/* Tab 1: Shipment Information */}
              {tabValue === 0 && (
                <Grid container spacing={3}>
                  {/* Pickup & Delivery */}
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Pickup & Delivery Information
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                              <LocationIcon color="primary" sx={{ mt: 0.5, mr: 1 }} />
                              <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Pickup Address
                                </Typography>
                                <Typography variant="body1">
                                  {shipment.pickupAddress}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                              <LocationIcon color="secondary" sx={{ mt: 0.5, mr: 1 }} />
                              <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Delivery Address
                                </Typography>
                                <Typography variant="body1">
                                  {shipment.deliveryAddress}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Dates */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Schedule
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <CalendarIcon color="primary" sx={{ mt: 0.5, mr: 1 }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Scheduled Pickup
                            </Typography>
                            <Typography variant="body1">
                              {formatDate(shipment.scheduledPickupDate)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <CalendarIcon color="secondary" sx={{ mt: 0.5, mr: 1 }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Estimated Delivery
                            </Typography>
                            <Typography variant="body1">
                              {shipment.estimatedDeliveryDate ? formatDate(shipment.estimatedDeliveryDate) : 'Not scheduled'}
                            </Typography>
                          </Box>
                        </Box>
                        {shipment.actualPickupDate && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <CalendarIcon color="success" sx={{ mt: 0.5, mr: 1 }} />
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">
                                Actual Pickup
                              </Typography>
                              <Typography variant="body1">
                                {formatDate(shipment.actualPickupDate)}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        {shipment.actualDeliveryDate && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <CalendarIcon color="success" sx={{ mt: 0.5, mr: 1 }} />
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">
                                Actual Delivery
                              </Typography>
                              <Typography variant="body1">
                                {formatDate(shipment.actualDeliveryDate)}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Package Details */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Package Details
                        </Typography>
                        {shipment.weight && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <InventoryIcon color="primary" sx={{ mt: 0.5, mr: 1 }} />
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">
                                Weight
                              </Typography>
                              <Typography variant="body1">
                                {shipment.weight} kg
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        {shipment.dimensions && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <InventoryIcon color="primary" sx={{ mt: 0.5, mr: 1 }} />
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary">
                                Dimensions
                              </Typography>
                              <Typography variant="body1">
                                {shipment.dimensions}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <PaymentsIcon color="primary" sx={{ mt: 0.5, mr: 1 }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Price
                            </Typography>
                            <Typography variant="body1">
                              ₹{parseFloat(shipment.price).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
                            Payment Status:
                          </Typography>
                          <Chip
                            label={shipment.paymentStatus}
                            color={getPaymentStatusColor(shipment.paymentStatus)}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Special Instructions */}
                  {shipment.specialInstructions && (
                    <Grid item xs={12}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Special Instructions
                          </Typography>
                          <Typography variant="body1">
                            {shipment.specialInstructions}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              )}
              
              {/* Tab 2: User Information */}
              {tabValue === 1 && shipment.user && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Requested By
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <PersonIcon color="primary" sx={{ mt: 0.5, mr: 1 }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Name
                            </Typography>
                            <Typography variant="body1">
                              {shipment.user.firstName} {shipment.user.lastName}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <EmailIcon color="primary" sx={{ mt: 0.5, mr: 1 }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Email
                            </Typography>
                            <Typography variant="body1">
                              {shipment.user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <PhoneIcon color="primary" sx={{ mt: 0.5, mr: 1 }} />
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                              Phone
                            </Typography>
                            <Typography variant="body1">
                              {shipment.user.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>
          ) : (
            <Typography>No shipment details available.</Typography>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {shipment && (
            <Button 
              variant="contained" 
              startIcon={<PrintIcon />} 
              onClick={handlePrint}
            >
              Print Details
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for success/error messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

ShipmentDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  shipmentId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default ShipmentDetailsModal;
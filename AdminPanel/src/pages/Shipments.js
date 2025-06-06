import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
  Tooltip,
  IconButton,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { getAdminShipments, formatDate, deleteAdminShipment, assignShipment } from '../services/shipmentService';
import { userService } from '../services/userService';
import { vehicleService } from '../services/vehicleService';
import ShipmentDetailsModal from '../components/ShipmentDetailsModal';
import ShipmentAssignmentDialog from '../components/ShipmentAssignmentDialog';
import ShipmentAssignmentSuccessModal from '../components/ShipmentAssignmentSuccessModal';

function Shipments() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredShipments, setFilteredShipments] = useState([]);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    currentPage: 1,
    totalShipments: 0
  });
  const [shipmentDetailsModal, setShipmentDetailsModal] = useState({
    open: false,
    shipmentId: null
  });
  
  // State for shipment deletion
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    shipmentId: null,
    trackingNumber: '',
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // State for shipment assignment
  const [assignmentDialog, setAssignmentDialog] = useState({
    open: false,
    shipment: null
  });
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [successModal, setSuccessModal] = useState({
    open: false,
    assignmentData: null
  });
  
  // Data for assignment dropdowns
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Fetch shipments data
  const fetchShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminShipments();
      setShipments(result.data.shipments);
      setFilteredShipments(result.data.shipments);
      setPagination({
        totalPages: result.totalPages || 1,
        currentPage: result.currentPage || 1,
        totalShipments: result.totalShipments || result.data.shipments.length
      });
    } catch (err) {
      setError('Failed to fetch shipments data. Please try again.');
      console.error('Error fetching shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch drivers and vehicles for assignment
  const fetchDriversAndVehicles = async () => {
    try {
      const [driversResponse, vehiclesResponse] = await Promise.all([
        userService.getDrivers(),
        vehicleService.getAvailableVehicles()
      ]);
      
      setDrivers(driversResponse.data.drivers || []);
      setVehicles(vehiclesResponse.data.vehicles || []);
    } catch (error) {
      console.error('Error fetching drivers and vehicles:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load drivers and vehicles data',
        severity: 'warning'
      });
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchShipments();
    fetchDriversAndVehicles();
  }, []);

  // Filter shipments based on tab selection and search query
  useEffect(() => {
    if (!shipments.length) return;

    let filtered = [...shipments];

    // Apply tab filter
    if (tabValue === 1) {
      filtered = filtered.filter(s => s.status === 'in-transit' || s.status === 'processing');
    } else if (tabValue === 2) {
      filtered = filtered.filter(s => s.status === 'delivered');
    } else if (tabValue === 3) {
      filtered = filtered.filter(s => s.status === 'pending');
    }

    // Apply search filter if there's a query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.trackingNumber.toLowerCase().includes(query) ||
        s.pickupAddress.toLowerCase().includes(query) ||
        s.deliveryAddress.toLowerCase().includes(query) ||
        (s.user && s.user.firstName && s.user.firstName.toLowerCase().includes(query)) ||
        (s.user && s.user.lastName && s.user.lastName.toLowerCase().includes(query)) ||
        (s.user && s.user.email && s.user.email.toLowerCase().includes(query))
      );
    }

    setFilteredShipments(filtered);
  }, [shipments, tabValue, searchQuery]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handlePageChange = (event, value) => {
    setPagination(prev => ({
      ...prev,
      currentPage: value
    }));
    // If backend pagination is implemented, fetch the specific page
    // fetchShipments({ page: value });
  };
  
  // Handle opening the shipment details modal
  const handleOpenShipmentDetails = (shipmentId) => {
    setShipmentDetailsModal({
      open: true,
      shipmentId
    });
  };
  
  // Handle closing the shipment details modal
  const handleCloseShipmentDetails = () => {
    setShipmentDetailsModal({
      open: false,
      shipmentId: null
    });
  };
  
  // Handle opening the delete confirmation dialog
  const handleOpenDeleteDialog = (shipment) => {
    setDeleteDialog({
      open: true,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber
    });
  };
  
  // Handle closing the delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      shipmentId: null,
      trackingNumber: ''
    });
  };
  
  // Handle shipment deletion
  const handleDeleteShipment = async () => {
    if (!deleteDialog.shipmentId) return;
    
    setDeleteLoading(true);
    
    try {
      await deleteAdminShipment(deleteDialog.shipmentId);
      
      // Show success message
      setSnackbar({
        open: true,
        message: `Shipment ${deleteDialog.trackingNumber} deleted successfully`,
        severity: 'success'
      });
      
      // Close the dialog
      handleCloseDeleteDialog();
      
      // Refresh the shipments list
      fetchShipments();
    } catch (error) {
      // Show error message
      setSnackbar({
        open: true,
        message: `Failed to delete shipment: ${error.response?.data?.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle opening the assignment dialog
  const handleOpenAssignmentDialog = (shipment) => {
    setAssignmentDialog({
      open: true,
      shipment
    });
  };

  // Handle closing the assignment dialog
  const handleCloseAssignmentDialog = () => {
    setAssignmentDialog({
      open: false,
      shipment: null
    });
  };

  // Handle shipment assignment
  const handleAssignShipment = async (assignmentData) => {
    if (!assignmentDialog.shipment) return;

    setAssignmentLoading(true);

    try {
      const response = await assignShipment(assignmentDialog.shipment.id, assignmentData);
      
      // Close assignment dialog
      handleCloseAssignmentDialog();
      
      // Show success modal with assignment details
      setSuccessModal({
        open: true,
        assignmentData: response.data
      });
      
      // Refresh shipments list
      fetchShipments();
      
    } catch (error) {
      // Show error message
      setSnackbar({
        open: true,
        message: `Failed to assign shipment: ${error.response?.data?.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Handle closing success modal
  const handleCloseSuccessModal = () => {
    setSuccessModal({
      open: false,
      assignmentData: null
    });
  };

  // Handle "Go to Shipment" from success modal
  const handleGoToShipment = (shipmentId) => {
    // Open shipment details modal
    setShipmentDetailsModal({
      open: true,
      shipmentId
    });
  };

  // Get status color for chip display
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'in-transit':
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Shipments Management
        </Typography>
        <Box>
          <Tooltip title="Refresh data">
            <IconButton onClick={fetchShipments} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => alert('Create shipment functionality coming soon!')}
          >
            Create Shipment
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Shipments
              </Typography>
              <Typography variant="h4">
                {pagination.totalShipments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending Shipments
              </Typography>
              <Typography variant="h4">
                {shipments.filter(s => s.status === 'pending').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed Shipments
              </Typography>
              <Typography variant="h4">
                {shipments.filter(s => s.status === 'delivered').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4">
                ₹{shipments.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="All Shipments" />
            <Tab label="Active" />
            <Tab label="Delivered" />
            <Tab label="Pending" />
          </Tabs>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by tracking number, address, or user details..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : filteredShipments.length === 0 ? (
          <Alert severity="info">No shipments found matching your criteria.</Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tracking #</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Pickup & Delivery</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Vehicle</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {shipment.trackingNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={shipment.status}
                          color={getStatusColor(shipment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationIcon fontSize="small" color="primary" />
                            <Typography variant="body2">From: {shipment.pickupAddress}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationIcon fontSize="small" color="secondary" />
                            <Typography variant="body2">To: {shipment.deliveryAddress}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2">
                            <strong>Pickup:</strong> {formatDate(shipment.scheduledPickupDate)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Delivery:</strong> {formatDate(shipment.estimatedDeliveryDate)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2"><strong>Weight:</strong> {shipment.weight} kg</Typography>
                        <Typography variant="body2"><strong>Dimensions:</strong> {shipment.dimensions}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2">
                            <strong>Price:</strong> ₹{parseFloat(shipment.price).toFixed(2)}
                          </Typography>
                          <Chip
                            label={shipment.paymentStatus}
                            color={getPaymentStatusColor(shipment.paymentStatus)}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {shipment.user ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon fontSize="small" />
                              <Typography variant="body2">
                                {shipment.user.firstName} {shipment.user.lastName}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <EmailIcon fontSize="small" />
                              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                {shipment.user.email}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PhoneIcon fontSize="small" />
                              <Typography variant="body2">{shipment.user.phone}</Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No user data</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {shipment.vehicle ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {typeof shipment.vehicle === 'object' 
                                ? `${shipment.vehicle.vehicleNumber} - ${shipment.vehicle.model}`
                                : shipment.vehicle
                              }
                            </Typography>
                            {typeof shipment.vehicle === 'object' && (
                              <Typography variant="body2" color="text.secondary">
                                {shipment.vehicle.type} • {shipment.vehicle.licensePlate}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Chip label="Not Assigned" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Assign Shipment">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleOpenAssignmentDialog(shipment)}
                              disabled={shipment.status === 'delivered' || shipment.status === 'cancelled'}
                            >
                              <AssignmentIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleOpenShipmentDetails(shipment.id)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Shipment">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleOpenDeleteDialog(shipment)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {pagination.totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
                <Pagination
                  count={pagination.totalPages}
                  page={pagination.currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
      
      {/* Shipment Details Modal */}
      <ShipmentDetailsModal
        open={shipmentDetailsModal.open}
        shipmentId={shipmentDetailsModal.shipmentId}
        onClose={handleCloseShipmentDetails}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Shipment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete shipment with tracking number{' '}
            <strong>{deleteDialog.trackingNumber}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDeleteDialog} 
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteShipment} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading && <CircularProgress size={16} color="inherit" />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Shipment Assignment Dialog */}
      <ShipmentAssignmentDialog
        open={assignmentDialog.open}
        onClose={handleCloseAssignmentDialog}
        shipment={assignmentDialog.shipment}
        drivers={drivers}
        vehicles={vehicles}
        onAssign={handleAssignShipment}
        loading={assignmentLoading}
      />

      {/* Assignment Success Modal */}
      <ShipmentAssignmentSuccessModal
        open={successModal.open}
        onClose={handleCloseSuccessModal}
        assignmentData={successModal.assignmentData}
        onGoToShipment={handleGoToShipment}
      />

      {/* Snackbar for notifications */}
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
    </Box>
  );
}

export default Shipments;
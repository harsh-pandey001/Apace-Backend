import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Alert,
  Snackbar,
  Chip,
  TablePagination,
  InputAdornment,
  Skeleton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  LocalShipping as VehicleIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Scale as WeightIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { vehicleService } from '../services/vehicleService';

const VehiclePricing = () => {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [newVehicle, setNewVehicle] = useState({
    vehicleType: '',
    label: '',
    capacity: '',
    basePrice: '',
    pricePerKm: '',
    startingPrice: '',
    isActive: true,
    iconKey: 'default'
  });

  // Icon options for dropdown
  const iconOptions = [
    { label: 'Truck', value: 'truck' },
    { label: 'Bike', value: 'bike' },
    { label: 'Car', value: 'car' },
    { label: 'Van', value: 'van' },
    { label: 'Bus', value: 'bus' },
    { label: 'Tractor', value: 'tractor' },
    { label: 'Container', value: 'container' },
    { label: 'Default', value: 'default' }
  ];

  // Fetch vehicle types
  const fetchVehicleTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getAllVehicleTypes();
      setVehicleTypes(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch vehicle types. Please try again.');
      console.error('Error fetching vehicle types:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  // Handle edit mode
  const handleEdit = (vehicle) => {
    console.log('🔧 DEBUG: handleEdit called with vehicle:', vehicle);
    console.log('🔧 DEBUG: vehicle.iconKey:', vehicle.iconKey);
    
    setEditingId(vehicle.id);
    const editDataToSet = {
      basePrice: vehicle.basePrice,
      pricePerKm: vehicle.pricePerKm,
      startingPrice: vehicle.startingPrice,
      capacity: vehicle.capacity,
      label: vehicle.label,
      iconKey: vehicle.iconKey || 'default'
    };
    
    console.log('🔧 DEBUG: editData to set:', editDataToSet);
    setEditData(editDataToSet);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Handle save edit
  const handleSaveEdit = async (vehicleId) => {
    try {
      // Validate input
      const { basePrice, pricePerKm, startingPrice } = editData;
      if (!basePrice || !pricePerKm || !startingPrice) {
        setError('All pricing fields are required');
        return;
      }

      if (parseFloat(basePrice) < 0 || parseFloat(pricePerKm) < 0 || parseFloat(startingPrice) < 0) {
        setError('Prices must be positive numbers');
        return;
      }

      await vehicleService.updateVehicleType(vehicleId, editData);
      setSuccess('Vehicle pricing updated successfully!');
      setEditingId(null);
      setEditData({});
      await fetchVehicleTypes();
      setSyncDialogOpen(true); // Show sync confirmation
    } catch (err) {
      setError('Failed to update vehicle pricing. Please try again.');
      console.error('Error updating vehicle:', err);
    }
  };

  // Handle input change during edit
  const handleEditInputChange = (field, value) => {
    console.log(`🔧 DEBUG: handleEditInputChange called - field: ${field}, value: ${value}`);
    const newEditData = {
      ...editData,
      [field]: value
    };
    console.log('🔧 DEBUG: new editData:', newEditData);
    setEditData(newEditData);
  };

  // Handle delete vehicle
  const handleDeleteVehicle = (vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteDialogOpen(true);
  };

  // Confirm delete vehicle
  const confirmDeleteVehicle = async () => {
    try {
      await vehicleService.deleteVehicleType(vehicleToDelete.id);
      setSuccess(`Vehicle type "${vehicleToDelete.label}" has been permanently deleted!`);
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
      await fetchVehicleTypes();
      setSyncDialogOpen(true); // Show sync confirmation
    } catch (err) {
      setError('Failed to delete vehicle type. Please try again.');
      console.error('Error deleting vehicle:', err);
    }
  };

  // Handle add new vehicle
  const handleAddVehicle = async () => {
    try {
      // Validate input
      const { vehicleType, label, capacity, basePrice, pricePerKm, startingPrice } = newVehicle;
      if (!vehicleType || !label || !capacity || !basePrice || !pricePerKm || !startingPrice) {
        setError('All fields are required');
        return;
      }

      if (parseFloat(basePrice) < 0 || parseFloat(pricePerKm) < 0 || parseFloat(startingPrice) < 0) {
        setError('Prices must be positive numbers');
        return;
      }

      await vehicleService.createVehicleType(newVehicle);
      setSuccess('Vehicle type created successfully!');
      setAddDialogOpen(false);
      setNewVehicle({
        vehicleType: '',
        label: '',
        capacity: '',
        basePrice: '',
        pricePerKm: '',
        startingPrice: '',
        isActive: true,
        iconKey: 'default'
      });
      await fetchVehicleTypes();
      setSyncDialogOpen(true); // Show sync confirmation
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create vehicle type. Please try again.');
      console.error('Error creating vehicle:', err);
    }
  };

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Close snackbars
  const handleCloseSuccess = () => setSuccess(null);
  const handleCloseError = () => setError(null);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VehicleIcon color="primary" />
            Vehicle Pricing Management
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Manage vehicle types, capacity, and pricing. Changes reflect in real-time across all apps.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          size="large"
        >
          Add Vehicle Type
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <VehicleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">{vehicleTypes.length}</Typography>
            <Typography variant="body2" color="textSecondary">Total Vehicle Types</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <MoneyIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">
              {vehicleTypes.length > 0 
                ? formatCurrency(Math.min(...vehicleTypes.map(v => parseFloat(v.basePrice))))
                : '₹0'
              }
            </Typography>
            <Typography variant="body2" color="textSecondary">Lowest Base Price</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <SpeedIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">
              {vehicleTypes.length > 0 
                ? formatCurrency(Math.max(...vehicleTypes.map(v => parseFloat(v.pricePerKm))))
                : '₹0'
              }
            </Typography>
            <Typography variant="body2" color="textSecondary">Highest Price/Km</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <WeightIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">{vehicleTypes.filter(v => v.isActive).length}</Typography>
            <Typography variant="body2" color="textSecondary">Active Types</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Vehicle Types Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>Vehicle Type</strong></TableCell>
                <TableCell><strong>Label</strong></TableCell>
                <TableCell><strong>Icon</strong></TableCell>
                <TableCell><strong>Capacity</strong></TableCell>
                <TableCell><strong>Base Price</strong></TableCell>
                <TableCell><strong>Price per Km</strong></TableCell>
                <TableCell><strong>Starting Price</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 9 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                vehicleTypes
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((vehicle) => {
                    if (editingId === vehicle.id) {
                      console.log('🔧 DEBUG: Rendering edit mode for vehicle:', vehicle.id);
                      console.log('🔧 DEBUG: Current editData:', editData);
                      console.log('🔧 DEBUG: editData.iconKey:', editData.iconKey);
                    }
                    return (
                    <TableRow key={vehicle.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {vehicle.vehicleType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {editingId === vehicle.id ? (
                          <TextField
                            value={editData.label || ''}
                            onChange={(e) => handleEditInputChange('label', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        ) : (
                          vehicle.label
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === vehicle.id ? (
                          <FormControl size="small" fullWidth>
                            <InputLabel id={`icon-select-${vehicle.id}`}>Icon</InputLabel>
                            <Select
                              labelId={`icon-select-${vehicle.id}`}
                              label="Icon"
                              value={editData.iconKey || 'default'}
                              onChange={(e) => {
                                console.log('🔧 DEBUG: Select onChange triggered, new value:', e.target.value);
                                handleEditInputChange('iconKey', e.target.value);
                              }}
                            >
                              {iconOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            label={iconOptions.find(opt => opt.value === vehicle.iconKey)?.label || 'Default'}
                            variant="outlined"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === vehicle.id ? (
                          <TextField
                            value={editData.capacity || ''}
                            onChange={(e) => handleEditInputChange('capacity', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        ) : (
                          vehicle.capacity
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === vehicle.id ? (
                          <TextField
                            value={editData.basePrice || ''}
                            onChange={(e) => handleEditInputChange('basePrice', e.target.value)}
                            type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                            size="small"
                            fullWidth
                          />
                        ) : (
                          formatCurrency(vehicle.basePrice)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === vehicle.id ? (
                          <TextField
                            value={editData.pricePerKm || ''}
                            onChange={(e) => handleEditInputChange('pricePerKm', e.target.value)}
                            type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                            size="small"
                            fullWidth
                          />
                        ) : (
                          formatCurrency(vehicle.pricePerKm)
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === vehicle.id ? (
                          <TextField
                            value={editData.startingPrice || ''}
                            onChange={(e) => handleEditInputChange('startingPrice', e.target.value)}
                            type="number"
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">₹</InputAdornment>
                            }}
                            size="small"
                            fullWidth
                          />
                        ) : (
                          formatCurrency(vehicle.startingPrice)
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vehicle.isActive ? 'Active' : 'Inactive'}
                          color={vehicle.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {editingId === vehicle.id ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Save changes">
                              <IconButton
                                onClick={() => handleSaveEdit(vehicle.id)}
                                color="primary"
                                size="small"
                              >
                                <SaveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel editing">
                              <IconButton
                                onClick={handleCancelEdit}
                                color="secondary"
                                size="small"
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit pricing">
                              <IconButton
                                onClick={() => handleEdit(vehicle)}
                                color="primary"
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete vehicle type permanently">
                              <IconButton
                                onClick={() => handleDeleteVehicle(vehicle)}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {!loading && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={vehicleTypes.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Paper>

      {/* Add Vehicle Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Vehicle Type</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Vehicle Type"
              placeholder="e.g., heavy_truck"
              value={newVehicle.vehicleType}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, vehicleType: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Display Label"
              placeholder="e.g., Heavy Truck"
              value={newVehicle.label}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, label: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Capacity"
              placeholder="e.g., Up to 2000kg"
              value={newVehicle.capacity}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, capacity: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Base Price"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>
              }}
              value={newVehicle.basePrice}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, basePrice: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Price per Km"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>
              }}
              value={newVehicle.pricePerKm}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, pricePerKm: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Starting Price"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>
              }}
              value={newVehicle.startingPrice}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, startingPrice: e.target.value }))}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Icon</InputLabel>
              <Select
                value={newVehicle.iconKey}
                label="Icon"
                onChange={(e) => setNewVehicle(prev => ({ ...prev, iconKey: e.target.value }))}
              >
                {iconOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddVehicle} variant="contained">Create Vehicle Type</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon color="error" />
          Confirm Vehicle Type Deletion
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to permanently delete the vehicle type:
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            {vehicleToDelete?.label} ({vehicleToDelete?.vehicleType})
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2, p: 2, backgroundColor: '#ffebee', borderRadius: 1 }}>
            <strong>⚠️ Warning:</strong> This action will permanently remove the vehicle type from the database. 
            This cannot be undone! Make sure no existing bookings are using this vehicle type before proceeding.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteVehicle} variant="contained" color="error">
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync Confirmation Dialog */}
      <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SyncIcon color="success" />
          Pricing Updated Successfully
        </DialogTitle>
        <DialogContent>
          <Typography>
            Your vehicle pricing changes have been saved and will be reflected in real-time across:
          </Typography>
          <Box sx={{ mt: 2, pl: 2 }}>
            <Typography>• User Mobile App - Booking price calculations</Typography>
            <Typography>• Driver App - Trip pricing information</Typography>
            <Typography>• Admin Dashboard - All pricing displays</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialogOpen(false)} variant="contained">
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        aria-label="add vehicle type"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', sm: 'none' }
        }}
        onClick={() => setAddDialogOpen(true)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default VehiclePricing;
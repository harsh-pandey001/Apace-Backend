import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TableSortLabel,
  Card,
  CardContent,
  Divider,
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
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
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

  // Validation states
  const [validationErrors, setValidationErrors] = useState({
    capacity: '',
    basePrice: '',
    pricePerKm: '',
    startingPrice: ''
  });

  const [editValidationErrors, setEditValidationErrors] = useState({
    capacity: '',
    basePrice: '',
    pricePerKm: '',
    startingPrice: ''
  });

  // Icon options for dropdown (fetched dynamically)
  const [iconOptions, setIconOptions] = useState([]);

  // Enhanced search, filter, and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    vehicleType: '',
    weightRange: '',
    priceRange: ''
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'capacity',
    direction: 'asc'
  });

  // Utility functions for enhanced search and filtering
  const parseCapacityValue = (capacity) => {
    if (!capacity) return 0;
    const numValue = parseFloat(capacity.toString().replace(/\s*kg\s*$/i, '').trim());
    return isNaN(numValue) ? 0 : numValue;
  };

  const getUniqueVehicleTypes = () => {
    const types = [...new Set(vehicleTypes.map(v => v.vehicleType))];
    return types.sort();
  };

  const getWeightRanges = () => [
    { label: 'All Weights', value: '' },
    { label: '0-100 kg', value: '0-100' },
    { label: '100-500 kg', value: '100-500' },
    { label: '500-1000 kg', value: '500-1000' },
    { label: '1000+ kg', value: '1000+' }
  ];

  const getPriceRanges = () => [
    { label: 'All Prices', value: '' },
    { label: 'Under ₹100', value: '0-100' },
    { label: '₹100-500', value: '100-500' },
    { label: '₹500-1000', value: '500-1000' },
    { label: '₹1000+', value: '1000+' }
  ];

  // Debounced search handler
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Validation functions
  const validateCapacity = (value) => {
    if (!value || value.trim() === '') {
      return 'Capacity is required';
    }
    
    // Remove existing "kg" suffix for validation
    const cleanValue = value.replace(/\s*kg\s*$/i, '').trim();
    
    if (!/^\d+(\.\d+)?$/.test(cleanValue)) {
      return 'Enter a valid number under 100000 for capacity.';
    }
    
    const numValue = parseFloat(cleanValue);
    if (numValue <= 0) {
      return 'Enter a valid number under 100000 for capacity.';
    }
    
    if (numValue > 100000) {
      return 'Enter a valid number under 100000 for capacity.';
    }
    
    return '';
  };

  const validatePrice = (value, fieldName) => {
    if (!value || value.toString().trim() === '') {
      return `${fieldName} is required`;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return 'Enter a valid price (number or decimal only).';
    }
    
    return '';
  };

  const formatCapacityValue = (value) => {
    if (!value) return '';
    
    // Remove existing "kg" suffix
    const cleanValue = value.replace(/\s*kg\s*$/i, '').trim();
    
    // Return just the number for display in input
    return cleanValue;
  };

  const formatPriceValue = (value) => {
    if (!value) return '';
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    
    // Format to 2 decimal places
    return numValue.toFixed(2);
  };

  // Filtering and sorting logic
  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = [...vehicleTypes];

    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(vehicle => {
        const capacityMatch = vehicle.capacity?.toLowerCase().includes(searchLower);
        const typeMatch = vehicle.vehicleType?.toLowerCase().includes(searchLower);
        const labelMatch = vehicle.label?.toLowerCase().includes(searchLower);
        const priceMatch = vehicle.basePrice?.toString().includes(searchLower) ||
                          vehicle.pricePerKm?.toString().includes(searchLower) ||
                          vehicle.startingPrice?.toString().includes(searchLower);
        return capacityMatch || typeMatch || labelMatch || priceMatch;
      });
    }

    // Apply vehicle type filter
    if (filters.vehicleType) {
      filtered = filtered.filter(vehicle => vehicle.vehicleType === filters.vehicleType);
    }

    // Apply weight range filter
    if (filters.weightRange) {
      const [min, max] = filters.weightRange.split('-').map(v => v === '+' ? Infinity : parseFloat(v));
      filtered = filtered.filter(vehicle => {
        const capacity = parseCapacityValue(vehicle.capacity);
        if (max === Infinity) {
          return capacity >= min;
        }
        return capacity >= min && capacity <= max;
      });
    }

    // Apply price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(v => v === '+' ? Infinity : parseFloat(v));
      filtered = filtered.filter(vehicle => {
        const basePrice = parseFloat(vehicle.basePrice);
        if (max === Infinity) {
          return basePrice >= min;
        }
        return basePrice >= min && basePrice <= max;
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        if (sortConfig.key === 'capacity') {
          aValue = parseCapacityValue(a.capacity);
          bValue = parseCapacityValue(b.capacity);
        } else if (sortConfig.key === 'basePrice' || sortConfig.key === 'pricePerKm' || sortConfig.key === 'startingPrice') {
          aValue = parseFloat(a[sortConfig.key]);
          bValue = parseFloat(b[sortConfig.key]);
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [vehicleTypes, debouncedSearchTerm, filters, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setPage(0); // Reset to first page when filtering
  };

  // Handle search change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(0); // Reset to first page when searching
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      vehicleType: '',
      weightRange: '',
      priceRange: ''
    });
    setSortConfig({
      key: 'capacity',
      direction: 'asc'
    });
    setPage(0);
  };

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

  // Fetch available icon options
  const fetchIconOptions = useCallback(async () => {
    try {
      const response = await vehicleService.getAvailableIconKeys();
      setIconOptions(response.data || []);
    } catch (err) {
      console.error('Error fetching icon options:', err);
      // Fallback to default options if API fails
      setIconOptions([
        { label: 'Truck', value: 'truck' },
        { label: 'Bike', value: 'bike' },
        { label: 'Car', value: 'car' },
        { label: 'Van', value: 'van' },
        { label: 'Bus', value: 'bus' },
        { label: 'Tractor', value: 'tractor' },
        { label: 'Container', value: 'container' },
        { label: 'Default', value: 'default' }
      ]);
    }
  }, []);

  useEffect(() => {
    fetchVehicleTypes();
    fetchIconOptions();
  }, [fetchVehicleTypes, fetchIconOptions]);

  // Handle edit mode
  const handleEdit = (vehicle) => {
    setEditingId(vehicle.id);
    const editDataToSet = {
      basePrice: vehicle.basePrice,
      pricePerKm: vehicle.pricePerKm,
      startingPrice: vehicle.startingPrice,
      capacity: vehicle.capacity, // Keep original format for editing
      label: vehicle.label,
      iconKey: vehicle.iconKey || 'default'
    };
    
    setEditData(editDataToSet);
    
    // Clear any existing validation errors
    setEditValidationErrors({
      capacity: '',
      basePrice: '',
      pricePerKm: '',
      startingPrice: ''
    });
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
      const { capacity, basePrice, pricePerKm, startingPrice } = editData;
      if (!capacity || !basePrice || !pricePerKm || !startingPrice) {
        setError('All fields are required');
        return;
      }

      // Validate each field
      const capacityError = validateCapacity(capacity);
      const basePriceError = validatePrice(basePrice, 'Base Price');
      const pricePerKmError = validatePrice(pricePerKm, 'Price per Km');
      const startingPriceError = validatePrice(startingPrice, 'Starting Price');

      // Update edit validation errors
      const newEditErrors = {
        capacity: capacityError,
        basePrice: basePriceError,
        pricePerKm: pricePerKmError,
        startingPrice: startingPriceError
      };
      setEditValidationErrors(newEditErrors);

      // Check if there are any validation errors
      if (capacityError || basePriceError || pricePerKmError || startingPriceError) {
        setError('Please fix the validation errors before saving');
        return;
      }

      // Format data for submission
      const formattedData = {
        ...editData,
        capacity: formatCapacityValue(capacity) + ' kg', // Add kg suffix before saving
        basePrice: formatPriceValue(basePrice),
        pricePerKm: formatPriceValue(pricePerKm),
        startingPrice: formatPriceValue(startingPrice)
      };

      await vehicleService.updateVehicleType(vehicleId, formattedData);
      setSuccess('Vehicle pricing updated successfully!');
      setEditingId(null);
      setEditData({});
      setEditValidationErrors({
        capacity: '',
        basePrice: '',
        pricePerKm: '',
        startingPrice: ''
      });
      await fetchVehicleTypes();
      setSyncDialogOpen(true); // Show sync confirmation
    } catch (err) {
      setError('Failed to update vehicle pricing. Please try again.');
      console.error('Error updating vehicle:', err);
    }
  };

  // Handle input change during edit
  const handleEditInputChange = (field, value) => {
    const newEditData = {
      ...editData,
      [field]: value
    };
    setEditData(newEditData);

    // Real-time validation
    let error = '';
    if (field === 'capacity') {
      error = validateCapacity(value);
    } else if (['basePrice', 'pricePerKm', 'startingPrice'].includes(field)) {
      const fieldName = field === 'basePrice' ? 'Base Price' : 
                       field === 'pricePerKm' ? 'Price per Km' : 'Starting Price';
      error = validatePrice(value, fieldName);
    }

    setEditValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Handle new vehicle input change with validation
  const handleNewVehicleInputChange = (field, value) => {
    setNewVehicle(prev => ({
      ...prev,
      [field]: value
    }));

    // Real-time validation
    let error = '';
    if (field === 'capacity') {
      error = validateCapacity(value);
    } else if (['basePrice', 'pricePerKm', 'startingPrice'].includes(field)) {
      const fieldName = field === 'basePrice' ? 'Base Price' : 
                       field === 'pricePerKm' ? 'Price per Km' : 'Starting Price';
      error = validatePrice(value, fieldName);
    }

    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Check if form is valid (for disabling submit button)
  const isFormValid = () => {
    const { vehicleType, label, capacity, basePrice, pricePerKm, startingPrice } = newVehicle;
    const hasAllFields = vehicleType && label && capacity && basePrice && pricePerKm && startingPrice;
    const hasNoErrors = !validationErrors.capacity && !validationErrors.basePrice && 
                       !validationErrors.pricePerKm && !validationErrors.startingPrice;
    return hasAllFields && hasNoErrors;
  };

  // Check if edit form is valid
  const isEditFormValid = () => {
    const { capacity, basePrice, pricePerKm, startingPrice } = editData;
    const hasAllFields = capacity && basePrice && pricePerKm && startingPrice;
    const hasNoErrors = !editValidationErrors.capacity && !editValidationErrors.basePrice && 
                       !editValidationErrors.pricePerKm && !editValidationErrors.startingPrice;
    return hasAllFields && hasNoErrors;
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
      // Validate all fields
      const { vehicleType, label, capacity, basePrice, pricePerKm, startingPrice } = newVehicle;
      
      // Basic required field validation
      if (!vehicleType || !label || !capacity || !basePrice || !pricePerKm || !startingPrice) {
        setError('All fields are required');
        return;
      }

      // Validate capacity
      const capacityError = validateCapacity(capacity);
      const basePriceError = validatePrice(basePrice, 'Base Price');
      const pricePerKmError = validatePrice(pricePerKm, 'Price per Km');
      const startingPriceError = validatePrice(startingPrice, 'Starting Price');

      // Update validation errors
      const newErrors = {
        capacity: capacityError,
        basePrice: basePriceError,
        pricePerKm: pricePerKmError,
        startingPrice: startingPriceError
      };
      setValidationErrors(newErrors);

      // Check if there are any validation errors
      if (capacityError || basePriceError || pricePerKmError || startingPriceError) {
        setError('Please fix the validation errors before submitting');
        return;
      }

      // Format data for submission
      const formattedData = {
        ...newVehicle,
        capacity: formatCapacityValue(capacity) + ' kg', // Add kg suffix before saving
        basePrice: formatPriceValue(basePrice),
        pricePerKm: formatPriceValue(pricePerKm),
        startingPrice: formatPriceValue(startingPrice)
      };

      await vehicleService.createVehicleType(formattedData);
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
      setValidationErrors({
        capacity: '',
        basePrice: '',
        pricePerKm: '',
        startingPrice: ''
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

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="primary" />
            Search & Filter Controls
          </Typography>
          
          {/* Search Bar */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search by vehicle type, capacity, or price..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="clear search"
                      onClick={() => handleSearchChange('')}
                      edge="end"
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              variant="outlined"
              size="small"
            />
          </Box>

          {/* Filter Controls */}
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  value={filters.vehicleType}
                  label="Vehicle Type"
                  onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {getUniqueVehicleTypes().map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Weight Range</InputLabel>
                <Select
                  value={filters.weightRange}
                  label="Weight Range"
                  onChange={(e) => handleFilterChange('weightRange', e.target.value)}
                >
                  {getWeightRanges().map(range => (
                    <MenuItem key={range.value} value={range.value}>{range.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Price Range</InputLabel>
                <Select
                  value={filters.priceRange}
                  label="Price Range"
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                >
                  {getPriceRanges().map(range => (
                    <MenuItem key={range.value} value={range.value}>{range.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={clearAllFilters}
                startIcon={<ClearIcon />}
                fullWidth
                size="small"
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>

          {/* Active Filter Summary */}
          {(debouncedSearchTerm || filters.vehicleType || filters.weightRange || filters.priceRange) && (
            <Box sx={{ mt: 2, pt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Active Filters: 
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {debouncedSearchTerm && (
                  <Chip
                    label={`Search: "${debouncedSearchTerm}"`}
                    onDelete={() => handleSearchChange('')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {filters.vehicleType && (
                  <Chip
                    label={`Type: ${filters.vehicleType}`}
                    onDelete={() => handleFilterChange('vehicleType', '')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {filters.weightRange && (
                  <Chip
                    label={`Weight: ${getWeightRanges().find(r => r.value === filters.weightRange)?.label}`}
                    onDelete={() => handleFilterChange('weightRange', '')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {filters.priceRange && (
                  <Chip
                    label={`Price: ${getPriceRanges().find(r => r.value === filters.priceRange)?.label}`}
                    onDelete={() => handleFilterChange('priceRange', '')}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Showing {filteredAndSortedVehicles.length} of {vehicleTypes.length} vehicle types
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Types Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>Vehicle Type</strong></TableCell>
                <TableCell><strong>Label</strong></TableCell>
                <TableCell><strong>Icon</strong></TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'capacity'}
                    direction={sortConfig.key === 'capacity' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('capacity')}
                  >
                    <strong>Capacity (Weight)</strong>
                    {sortConfig.key === 'capacity' && (
                      <Box component="span" sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}>
                        {sortConfig.direction === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'basePrice'}
                    direction={sortConfig.key === 'basePrice' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('basePrice')}
                  >
                    <strong>Base Price</strong>
                    {sortConfig.key === 'basePrice' && (
                      <Box component="span" sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}>
                        {sortConfig.direction === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'pricePerKm'}
                    direction={sortConfig.key === 'pricePerKm' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('pricePerKm')}
                  >
                    <strong>Price per Km</strong>
                    {sortConfig.key === 'pricePerKm' && (
                      <Box component="span" sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}>
                        {sortConfig.direction === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.key === 'startingPrice'}
                    direction={sortConfig.key === 'startingPrice' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('startingPrice')}
                  >
                    <strong>Starting Price</strong>
                    {sortConfig.key === 'startingPrice' && (
                      <Box component="span" sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}>
                        {sortConfig.direction === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
                      </Box>
                    )}
                  </TableSortLabel>
                </TableCell>
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
                filteredAndSortedVehicles
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((vehicle) => (
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
                              onChange={(e) => handleEditInputChange('iconKey', e.target.value)}
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
                            value={formatCapacityValue(editData.capacity || '')}
                            onChange={(e) => handleEditInputChange('capacity', e.target.value)}
                            size="small"
                            fullWidth
                            error={!!editValidationErrors.capacity}
                            helperText={editValidationErrors.capacity}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">kg</InputAdornment>
                            }}
                            inputProps={{
                              inputMode: 'numeric',
                              pattern: '[0-9]*'
                            }}
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
                            error={!!editValidationErrors.basePrice}
                            helperText={editValidationErrors.basePrice}
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
                            error={!!editValidationErrors.pricePerKm}
                            helperText={editValidationErrors.pricePerKm}
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
                            error={!!editValidationErrors.startingPrice}
                            helperText={editValidationErrors.startingPrice}
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
                                disabled={!isEditFormValid()}
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
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {!loading && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredAndSortedVehicles.length}
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
              placeholder="e.g., 2000"
              value={formatCapacityValue(newVehicle.capacity)}
              onChange={(e) => handleNewVehicleInputChange('capacity', e.target.value)}
              fullWidth
              required
              error={!!validationErrors.capacity}
              helperText={validationErrors.capacity}
              InputProps={{
                endAdornment: <InputAdornment position="end">kg</InputAdornment>
              }}
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*'
              }}
            />
            <TextField
              label="Base Price"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>
              }}
              value={newVehicle.basePrice}
              onChange={(e) => handleNewVehicleInputChange('basePrice', e.target.value)}
              fullWidth
              required
              error={!!validationErrors.basePrice}
              helperText={validationErrors.basePrice}
            />
            <TextField
              label="Price per Km"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>
              }}
              value={newVehicle.pricePerKm}
              onChange={(e) => handleNewVehicleInputChange('pricePerKm', e.target.value)}
              fullWidth
              required
              error={!!validationErrors.pricePerKm}
              helperText={validationErrors.pricePerKm}
            />
            <TextField
              label="Starting Price"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>
              }}
              value={newVehicle.startingPrice}
              onChange={(e) => handleNewVehicleInputChange('startingPrice', e.target.value)}
              fullWidth
              required
              error={!!validationErrors.startingPrice}
              helperText={validationErrors.startingPrice}
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
          <Button 
            onClick={handleAddVehicle} 
            variant="contained" 
            disabled={!isFormValid()}
          >
            Create Vehicle Type
          </Button>
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
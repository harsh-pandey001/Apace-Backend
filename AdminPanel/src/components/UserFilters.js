import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

const UserFilters = ({ onSearch, onFilter, isDriverMode = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandFilters, setExpandFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    vehicleType: '',
    verified: '',
    availability: '',
  });
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  const toggleFilters = () => {
    setExpandFilters(!expandFilters);
  };

  const applyFilters = () => {
    // Create a list of active filters for the chips
    const newActiveFilters = [];
    
    
    if (filters.vehicleType && isDriverMode) {
      newActiveFilters.push({ 
        field: 'vehicleType', 
        value: filters.vehicleType, 
        label: `Vehicle: ${filters.vehicleType}` 
      });
    }
    
    if (filters.verified && isDriverMode) {
      const verifiedLabel = filters.verified === 'true' ? 'Verified' : 'Pending';
      newActiveFilters.push({ 
        field: 'verified', 
        value: filters.verified, 
        label: `Verification: ${verifiedLabel}` 
      });
    }
    
    if (filters.availability && isDriverMode) {
      newActiveFilters.push({ 
        field: 'availability', 
        value: filters.availability, 
        label: `Availability: ${filters.availability.charAt(0).toUpperCase() + filters.availability.slice(1)}` 
      });
    }
    
    if (filters.status) {
      newActiveFilters.push({ field: 'status', value: filters.status, label: `Status: ${filters.status}` });
    }
    
    if (filters.dateRange) {
      const rangeMappings = {
        'today': 'Today',
        'yesterday': 'Yesterday',
        'last7days': 'Last 7 days',
        'last30days': 'Last 30 days',
        'last90days': 'Last 90 days',
      };
      newActiveFilters.push({ 
        field: 'dateRange', 
        value: filters.dateRange, 
        label: `Registered: ${rangeMappings[filters.dateRange]}` 
      });
    }
    
    setActiveFilters(newActiveFilters);
    
    // Call the parent component's filter function with raw filters
    // The UserTable component will handle client-side filtering
    onFilter(filters);
  };

  // Fetch vehicle types from API when in driver mode
  useEffect(() => {
    if (isDriverMode) {
      fetchVehicleTypes();
    }
  }, [isDriverMode]);

  const fetchVehicleTypes = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://apace-backend-86500976134.us-central1.run.app/api';
      const response = await fetch(`${baseUrl}/vehicles`);
      const data = await response.json();
      if (data.success && data.data) {
        const types = data.data.map(vehicle => ({
          value: vehicle.type.toLowerCase(),
          label: vehicle.name || vehicle.type
        }));
        setVehicleTypes(types);
      }
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      // Fallback to static list
      setVehicleTypes([
        { value: 'bike', label: 'Bike' },
        { value: 'motorcycle', label: 'Motorcycle' },
        { value: 'car', label: 'Car' },
        { value: 'van', label: 'Van' },
        { value: 'truck', label: 'Truck' },
        { value: 'mini_truck', label: 'Mini Truck' },
        { value: 'pickup', label: 'Pickup' }
      ]);
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      dateRange: '',
      vehicleType: '',
      verified: '',
      availability: '',
    });
    setActiveFilters([]);
    onFilter({}); // Reset filters
  };

  const removeFilter = (field) => {
    const updatedFilters = {
      ...filters,
      [field]: '',
    };
    
    setFilters(updatedFilters);
    
    // Update active filters list
    setActiveFilters(activeFilters.filter(filter => filter.field !== field));
    
    // Call parent filter with updated filters (client-side filtering)
    onFilter(updatedFilters);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={isDriverMode ? "Search by name, email, phone, vehicle type, or vehicle number..." : "Search by name, email, or phone..."}
          value={searchTerm}
          onChange={handleSearchChange}
          aria-label="Search users"
          inputProps={{
            'aria-autocomplete': 'list',
            'aria-haspopup': 'false'
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => {
                  setSearchTerm('');
                  onSearch('');
                }}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      {/* Filter Toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="text"
          color="primary"
          startIcon={<FilterIcon />}
          endIcon={expandFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={toggleFilters}
          aria-expanded={expandFilters}
          aria-controls="filter-panel"
          aria-label={expandFilters ? "Hide filters" : "Show filters"}
        >
          {isDriverMode ? 'Filter Drivers' : 'Filter Users'}
        </Button>
        
        {activeFilters.length > 0 && (
          <Button
            variant="text"
            color="primary"
            startIcon={<ClearIcon />}
            onClick={clearFilters}
            size="small"
          >
            Clear All Filters
          </Button>
        )}
      </Box>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {activeFilters.map((filter, index) => (
            <Chip
              key={index}
              label={filter.label}
              onDelete={() => removeFilter(filter.field)}
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      )}

      {/* Expandable Filters */}
      <Collapse in={expandFilters} id="filter-panel" role="region" aria-label="Filter options">
        <Grid container spacing={2} sx={{ mb: 2 }}>
          
          {isDriverMode && (
            <>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="vehicle-type-filter-label">Vehicle Type</InputLabel>
                  <Select
                    labelId="vehicle-type-filter-label"
                    id="vehicle-type-filter"
                    value={filters.vehicleType}
                    label="Vehicle Type"
                    onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All Vehicle Types</em>
                    </MenuItem>
                    {vehicleTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="verified-filter-label">Verification Status</InputLabel>
                  <Select
                    labelId="verified-filter-label"
                    id="verified-filter"
                    value={filters.verified}
                    label="Verification Status"
                    onChange={(e) => handleFilterChange('verified', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All Statuses</em>
                    </MenuItem>
                    <MenuItem value="true">Verified</MenuItem>
                    <MenuItem value="false">Pending Verification</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="availability-filter-label">Availability Status</InputLabel>
                  <Select
                    labelId="availability-filter-label"
                    id="availability-filter"
                    value={filters.availability}
                    label="Availability Status"
                    onChange={(e) => handleFilterChange('availability', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All Availability</em>
                    </MenuItem>
                    <MenuItem value="online">Online</MenuItem>
                    <MenuItem value="offline">Offline</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          
          {!isDriverMode && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All Statuses</em>
                    </MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="date-filter-label">Registration Date</InputLabel>
                  <Select
                    labelId="date-filter-label"
                    id="date-filter"
                    value={filters.dateRange}
                    label="Registration Date"
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All Time</em>
                    </MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="yesterday">Yesterday</MenuItem>
                    <MenuItem value="last7days">Last 7 Days</MenuItem>
                    <MenuItem value="last30days">Last 30 Days</MenuItem>
                    <MenuItem value="last90days">Last 90 Days</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          
          {isDriverMode && (
            <>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="status-filter-label">Activity Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    value={filters.status}
                    label="Activity Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All Statuses</em>
                    </MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="date-filter-label">Registration Date</InputLabel>
                  <Select
                    labelId="date-filter-label"
                    id="date-filter"
                    value={filters.dateRange}
                    label="Registration Date"
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  >
                    <MenuItem value="">
                      <em>All Time</em>
                    </MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="yesterday">Yesterday</MenuItem>
                    <MenuItem value="last7days">Last 7 Days</MenuItem>
                    <MenuItem value="last30days">Last 30 Days</MenuItem>
                    <MenuItem value="last90days">Last 90 Days</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={applyFilters}
          >
            Apply Filters
          </Button>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default UserFilters;
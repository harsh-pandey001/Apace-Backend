import React, { useState } from 'react';
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

const UserFilters = ({ onSearch, onFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandFilters, setExpandFilters] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    dateRange: '',
  });
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
    
    if (filters.role) {
      const roleLabels = {
        'admin': 'Admin',
        'driver': 'Driver', 
        'user': 'Customer'
      };
      newActiveFilters.push({ 
        field: 'role', 
        value: filters.role, 
        label: `Role: ${roleLabels[filters.role] || filters.role}` 
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

  const clearFilters = () => {
    setFilters({
      role: '',
      status: '',
      dateRange: '',
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
          placeholder="Search by name, email, or phone..."
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
          Filter Users
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
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="role-filter-label">Role</InputLabel>
              <Select
                labelId="role-filter-label"
                id="role-filter"
                value={filters.role}
                label="Role"
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <MenuItem value="">
                  <em>All Roles</em>
                </MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="driver">Driver</MenuItem>
                <MenuItem value="user">Customer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
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
          
          <Grid item xs={12} sm={4}>
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
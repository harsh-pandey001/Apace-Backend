import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  DeleteForever as DeleteForeverIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  VerifiedUser as VerifiedUserIcon,
  Pending as PendingIcon,
  DirectionsCar as CarIcon,
} from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { format } from 'date-fns';
import driverService from '../services/driverService';
import DriverDetailsModal from './DriverDetailsModal';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

// Column definition for drivers
const headCells = [
  { id: 'name', label: 'Name', width: '20%' },
  { id: 'email', label: 'Email', width: '20%' },
  { id: 'phone', label: 'Phone', width: '15%' },
  { id: 'vehicleType', label: 'Vehicle Type', width: '15%' },
  { id: 'vehicleNumber', label: 'Vehicle Number', width: '15%' },
  { id: 'status', label: 'Status', width: '10%' },
  { id: 'createdAt', label: 'Registration Date', width: '15%' },
  { id: 'actions', label: 'Actions', width: '5%' },
];

function DriverTableHead(props) {
  const { order, orderBy, onRequestSort } = props;
  
  const createSortHandler = (property) => (event) => {
    if (property !== 'actions') {
      onRequestSort(event, property);
    }
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{ width: headCell.width }}
          >
            {headCell.id !== 'actions' ? (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            ) : (
              headCell.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

DriverTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
};

const DriverTable = ({ searchTerm, filters, onDriverDataChange }) => {
  // State for sorting
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  
  // State for drivers data
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalDrivers, setTotalDrivers] = useState(0);
  
  // State for action menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // State for driver details modal
  const [driverDetailsOpen, setDriverDetailsOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  
  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // State for all drivers (unfiltered)
  const [allDrivers, setAllDrivers] = useState([]);

  // Filter drivers client-side based on search and filters
  const getFilteredDrivers = React.useCallback(() => {
    let filteredDrivers = [...allDrivers];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredDrivers = filteredDrivers.filter(driver =>
        driver.name?.toLowerCase().includes(searchLower) ||
        driver.email?.toLowerCase().includes(searchLower) ||
        driver.phone?.toLowerCase().includes(searchLower) ||
        driver.vehicleType?.toLowerCase().includes(searchLower) ||
        driver.vehicleNumber?.toLowerCase().includes(searchLower) ||
        driver.availability_status?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status) {
      const isActive = filters.status === 'active';
      filteredDrivers = filteredDrivers.filter(driver => driver.isActive === isActive);
    }

    // Apply verification filter
    if (filters.verified !== undefined && filters.verified !== '') {
      const isVerified = filters.verified === 'true';
      filteredDrivers = filteredDrivers.filter(driver => driver.isVerified === isVerified);
    }

    // Apply availability filter
    if (filters.availability) {
      filteredDrivers = filteredDrivers.filter(driver => 
        driver.availability_status?.toLowerCase() === filters.availability.toLowerCase()
      );
    }

    // Apply vehicle type filter
    if (filters.vehicleType) {
      filteredDrivers = filteredDrivers.filter(driver => 
        driver.vehicleType?.toLowerCase() === filters.vehicleType.toLowerCase()
      );
    }

    // Apply date range filter
    if (filters.dateRange) {
      const now = new Date();
      let startDate;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          filteredDrivers = filteredDrivers.filter(driver => {
            const driverDate = new Date(driver.createdAt);
            return driverDate >= startDate && driverDate < endDate;
          });
          return filteredDrivers;
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          break;
      }

      if (startDate && filters.dateRange !== 'yesterday') {
        filteredDrivers = filteredDrivers.filter(driver => {
          const driverDate = new Date(driver.createdAt);
          return driverDate >= startDate;
        });
      }
    }

    return filteredDrivers;
  }, [allDrivers, searchTerm, filters]);

  // Get paginated drivers from filtered results
  const getPaginatedDrivers = React.useCallback(() => {
    const filteredDrivers = getFilteredDrivers();
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredDrivers.slice(startIndex, endIndex);
  }, [getFilteredDrivers, page, rowsPerPage]);

  // Fetch drivers data from API
  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all drivers without server-side filtering
      const response = await driverService.getAllDrivers({
        page: 1,
        limit: 9999, // Get all drivers for client-side filtering
      });
      
      setAllDrivers(response.data.drivers || []);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to load drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch drivers when component mounts
  useEffect(() => {
    if (allDrivers.length === 0) {
      fetchDrivers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update filtered results when search term, filters, or pagination changes
  useEffect(() => {
    if (allDrivers.length > 0) {
      const filteredDrivers = getFilteredDrivers();
      setDrivers(getPaginatedDrivers());
      setTotalDrivers(filteredDrivers.length);
      
      // Reset to first page if current page exceeds available pages
      const maxPages = Math.ceil(filteredDrivers.length / rowsPerPage);
      if (page >= maxPages && maxPages > 0) {
        setPage(0);
      }
      
      // Notify parent component about the filtered data for stats
      if (onDriverDataChange) {
        const filteredResponse = {
          data: {
            drivers: filteredDrivers
          },
          totalDrivers: filteredDrivers.length
        };
        onDriverDataChange(filteredResponse);
      }
    }
  }, [getFilteredDrivers, getPaginatedDrivers, page, rowsPerPage, allDrivers, onDriverDataChange]);

  // Sort the drivers data based on order and orderBy
  const sortedDrivers = React.useMemo(() => {
    if (!drivers || drivers.length === 0) return [];
    
    const stabilizedDrivers = drivers.map((driver, index) => [driver, index]);
    
    stabilizedDrivers.sort((a, b) => {
      const driverA = a[0];
      const driverB = b[0];
      
      // Handle date sorting
      if (orderBy === 'createdAt') {
        const dateA = new Date(driverA.createdAt);
        const dateB = new Date(driverB.createdAt);
        
        if (order === 'asc') {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      }
      
      // Handle other fields
      const valueA = driverA[orderBy] || '';
      const valueB = driverB[orderBy] || '';
      
      if (order === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
    
    return stabilizedDrivers.map((driver) => driver[0]);
  }, [drivers, order, orderBy]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event, driver) => {
    setAnchorEl(event.currentTarget);
    setSelectedDriver(driver);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDriver = (driver) => {
    const driverToView = driver || selectedDriver;
    if (!driverToView) return;
    
    setSelectedDriverId(driverToView.id);
    setDriverDetailsOpen(true);
    
    // Close menu if it was triggered from the menu
    if (!driver) {
      handleMenuClose();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDriver) return;
    
    setDeleteLoading(true);
    
    try {
      await driverService.deleteDriver(selectedDriver.id);
      
      // Show success notification
      setSnackbar({
        open: true,
        message: 'Driver deleted successfully.',
        severity: 'success'
      });
      
      // Close the delete dialog
      setDeleteDialogOpen(false);
      
      // Reload the data
      fetchDrivers();
    } catch (err) {
      console.error('Error deleting driver:', err);
      
      // Show error notification
      setSnackbar({
        open: true,
        message: 'Failed to delete driver. Please try again.',
        severity: 'error'
      });
      
      // Close the delete dialog
      setDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!selectedDriver) return;
    
    try {
      await driverService.updateDriverAvailability(selectedDriver.id, {
        availability_status: selectedDriver.availability_status === 'online' ? 'offline' : 'online'
      });
      fetchDrivers(); // Reload the data
      handleMenuClose();
    } catch (err) {
      console.error('Error updating driver status:', err);
      // Show error notification
      setError('Failed to update driver status. Please try again.');
      handleMenuClose();
    }
  };

  const handleRefresh = () => {
    fetchDrivers();
  };
  
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleDriverDetailsClose = () => {
    setDriverDetailsOpen(false);
    setSelectedDriverId(null);
    
    // Refresh drivers to show latest changes
    fetchDrivers();
  };

  const getStatusColor = (status) => {
    return status ? 'success' : 'error';
  };

  const getStatusIcon = (status) => {
    return status ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />;
  };

  const getVerificationColor = (isVerified) => {
    return isVerified ? 'success' : 'warning';
  };

  const getVerificationIcon = (isVerified) => {
    return isVerified ? <VerifiedUserIcon fontSize="small" /> : <PendingIcon fontSize="small" />;
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

  // Format date using date-fns
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <>
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button 
            color="inherit" 
            size="small" 
            sx={{ ml: 2 }} 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </Alert>
      )}
    
      <TableContainer 
        component={Paper} 
        sx={{ maxHeight: 600 }}
        aria-label="Drivers data table"
        role="region"
        aria-roledescription="Driver management table"
      >
        {/* Accessibility: Add a caption for screen readers */}
        <caption style={{ position: 'absolute', left: '-9999px', height: '1px', overflow: 'hidden' }}>
          Table of drivers with information including name, email, phone, vehicle details, status, and registration date
        </caption>
        
        <Table stickyHeader aria-label="drivers table" size="medium">
          <DriverTableHead
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
          />
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Loading drivers...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : sortedDrivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1">
                    No drivers found
                  </Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ mt: 2 }} 
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                  >
                    Refresh Data
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              sortedDrivers.map((driver) => (
                <TableRow
                  hover
                  key={driver.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  aria-label={`Driver ${driver.name}`}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          mr: 2, 
                          bgcolor: getVehicleTypeColor(driver.vehicleType),
                          width: 40,
                          height: 40
                        }}
                      >
                        <CarIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1">{driver.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{driver.id}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{driver.email}</TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>
                    <Chip 
                      label={driver.vehicleType} 
                      size="small"
                      sx={{
                        bgcolor: getVehicleTypeColor(driver.vehicleType),
                        color: 'white',
                        textTransform: 'capitalize'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {driver.vehicleNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {driver.vehicleCapacity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip 
                        icon={getStatusIcon(driver.isActive)}
                        label={driver.isActive ? 'Active' : 'Inactive'} 
                        color={getStatusColor(driver.isActive)} 
                        size="small"
                        variant="outlined"
                      />
                      <Chip 
                        icon={getVerificationIcon(driver.isVerified)}
                        label={driver.isVerified ? 'Verified' : 'Pending'} 
                        color={getVerificationColor(driver.isVerified)} 
                        size="small"
                        variant="filled"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(driver.createdAt)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          aria-label="view driver details"
                          size="small"
                          color="primary"
                          onClick={() => handleViewDriver(driver)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        aria-label="more options"
                        size="small"
                        onClick={(e) => handleMenuClick(e, driver)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalDrivers}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelDisplayedRows={({ from, to, count }) => {
          return `Showing ${from}–${to} of ${count !== -1 ? count : `more than ${to}`} drivers`;
        }}
        labelRowsPerPage="Drivers per page:"
        aria-label="Driver table pagination"
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleToggleStatus}>
          {selectedDriver?.availability_status === 'online' ? (
            <>
              <BlockIcon fontSize="small" sx={{ mr: 1 }} />
              Set Offline
            </>
          ) : (
            <>
              <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
              Set Online
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteForeverIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Driver
        </MenuItem>
      </Menu>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        entityName="Driver"
        confirmationText={selectedDriver ? `Are you sure you want to delete ${selectedDriver.name}? This action cannot be undone.` : ''}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
      
      {/* Driver Details Modal */}
      <DriverDetailsModal
        open={driverDetailsOpen}
        driverId={selectedDriverId}
        onClose={handleDriverDetailsClose}
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
    </>
  );
};

DriverTable.propTypes = {
  searchTerm: PropTypes.string,
  filters: PropTypes.object,
  onDriverDataChange: PropTypes.func,
};

DriverTable.defaultProps = {
  searchTerm: '',
  filters: {},
};

export default DriverTable;
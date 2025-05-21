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
  Pagination
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { getAdminShipments, formatDate } from '../services/shipmentService';

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

  // Load data when component mounts
  useEffect(() => {
    fetchShipments();
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
                ${shipments.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0).toFixed(2)}
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
                            <strong>Price:</strong> ${parseFloat(shipment.price).toFixed(2)}
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
                          <Typography variant="body2">{shipment.vehicle}</Typography>
                        ) : (
                          <Chip label="Not Assigned" size="small" />
                        )}
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
    </Box>
  );
}

export default Shipments;
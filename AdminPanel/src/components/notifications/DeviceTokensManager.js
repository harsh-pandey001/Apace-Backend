import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  Devices as DevicesIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  PhoneAndroid as AndroidIcon,
  PhoneIphone as IosIcon,
  Computer as WebIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import axios from 'axios';

const DeviceTokensManager = ({ showSnackbar }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statistics, setStatistics] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    platform: '',
    status: ''
  });

  const platformOptions = [
    { value: '', label: 'All Platforms' },
    { value: 'android', label: 'Android' },
    { value: 'ios', label: 'iOS' },
    { value: 'web', label: 'Web' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];

  useEffect(() => {
    loadDeviceTokens();
    loadStatistics();
  }, [page, rowsPerPage, filters]);

  const loadDeviceTokens = async () => {
    try {
      setLoading(true);
      
      const baseURL = process.env.REACT_APP_API_URL || 'https://apace-backend-dev-86500976134.us-central1.run.app/api';
      const token = localStorage.getItem('auth_token');
      
      const response = await axios.get(`${baseURL}/notifications/device-tokens`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          page: page + 1,
          limit: rowsPerPage,
          platform: filters.platform || undefined,
          status: filters.status || undefined,
          search: filters.search || undefined
        }
      });
      
      setTokens(response.data.tokens || []);
      setTotalCount(response.data.totalCount || 0);
      
    } catch (error) {
      console.error('Failed to load device tokens:', error);
      
      // Show that device token management is not implemented yet
      setTokens([]);
      setTotalCount(0);
      
      if (error.response?.status === 404) {
        showSnackbar('Device token management endpoint not implemented yet', 'info');
      } else {
        showSnackbar('Failed to load device tokens', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'https://apace-backend-dev-86500976134.us-central1.run.app/api';
      const token = localStorage.getItem('auth_token');
      
      const response = await axios.get(`${baseURL}/notifications/device-tokens/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setStatistics(response.data);
      
    } catch (error) {
      console.error('Failed to load token statistics:', error);
      setStatistics(null);
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      platform: '',
      status: ''
    });
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'android': return <AndroidIcon fontSize="small" />;
      case 'ios': return <IosIcon fontSize="small" />;
      case 'web': return <WebIcon fontSize="small" />;
      default: return <DevicesIcon fontSize="small" />;
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'android': return 'success';
      case 'ios': return 'info';
      case 'web': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'error';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDeleteToken = async (tokenId) => {
    try {
      const baseURL = process.env.REACT_APP_API_URL || 'https://apace-backend-dev-86500976134.us-central1.run.app/api';
      const token = localStorage.getItem('auth_token');
      
      await axios.delete(`${baseURL}/notifications/device-tokens/${tokenId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      showSnackbar('Device token deleted successfully', 'success');
      loadDeviceTokens();
      loadStatistics();
      
    } catch (error) {
      console.error('Failed to delete device token:', error);
      showSnackbar('Failed to delete device token', 'error');
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DevicesIcon />
          Device Tokens Manager
        </Typography>

        {/* Statistics Cards */}
        {statistics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {statistics.totalTokens || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Tokens
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {statistics.activeTokens || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Tokens
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {statistics.androidTokens || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Android Devices
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {statistics.iosTokens || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    iOS Devices
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search by user or token"
              value={filters.search}
              onChange={handleFilterChange('search')}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Platform</InputLabel>
              <Select
                value={filters.platform}
                onChange={handleFilterChange('platform')}
                label="Platform"
              >
                {platformOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={handleFilterChange('status')}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1, height: '56px', alignItems: 'center' }}>
              <IconButton onClick={handleClearFilters} title="Clear Filters">
                <ClearIcon />
              </IconButton>
              <IconButton onClick={loadDeviceTokens} title="Refresh">
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Alert for no device token management */}
        {!loading && tokens.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📱 Device Token Management Not Implemented
            </Typography>
            <Typography>
              Device token management requires additional database tables and API endpoints. 
              Currently, FCM tokens are handled automatically by the notification service when users register, 
              but they are not stored in a dedicated tokens table for management.
            </Typography>
            <Typography sx={{ mt: 1 }}>
              To implement device token management:
            </Typography>
            <ul>
              <li>Create a device_tokens table in the database</li>
              <li>Store tokens when users register for notifications</li>
              <li>Implement API endpoints for token CRUD operations</li>
              <li>Add token cleanup for expired/invalid tokens</li>
            </ul>
            <Typography sx={{ mt: 1, fontWeight: 'bold' }}>
              ✅ FCM notifications are working correctly without centralized token management.
            </Typography>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Table */}
        {!loading && tokens.length > 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Platform</TableCell>
                  <TableCell>Token</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokens.map((tokenData) => (
                  <TableRow key={tokenData.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {tokenData.user?.name || tokenData.userName || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {tokenData.user?.email || tokenData.userEmail || 'No email'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        icon={getPlatformIcon(tokenData.platform)}
                        label={tokenData.platform?.toUpperCase() || 'Unknown'}
                        color={getPlatformColor(tokenData.platform)}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {tokenData.token?.substring(0, 20)}...
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={tokenData.status?.toUpperCase() || 'UNKNOWN'}
                        color={getStatusColor(tokenData.status)}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      {formatDate(tokenData.lastUsed || tokenData.updatedAt)}
                    </TableCell>
                    
                    <TableCell>
                      <IconButton
                        onClick={() => handleDeleteToken(tokenData.id)}
                        color="error"
                        size="small"
                        title="Delete Token"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {!loading && tokens.length > 0 && (
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        )}
      </Paper>
    </Box>
  );
};

export default DeviceTokensManager;
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
  useTheme
} from '@mui/material';
import {
  History as HistoryIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import axios from 'axios';

const NotificationHistory = ({ showSnackbar }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: ''
  });

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'sent', label: 'Sent' },
    { value: 'failed', label: 'Failed' },
    { value: 'pending', label: 'Pending' }
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'booking_confirmed', label: 'Booking Confirmed' },
    { value: 'driver_assigned', label: 'Driver Assigned' },
    { value: 'shipment_picked_up', label: 'Shipment Picked Up' },
    { value: 'shipment_delivered', label: 'Shipment Delivered' },
    { value: 'payment_reminder', label: 'Payment Reminder' },
    { value: 'system_announcement', label: 'System Announcement' }
  ];

  useEffect(() => {
    loadNotificationHistory();
  }, [page, rowsPerPage, filters]);

  const loadNotificationHistory = async () => {
    try {
      setLoading(true);
      
      const baseURL = process.env.REACT_APP_API_URL || 'https://apace-backend-dev-86500976134.us-central1.run.app/api';
      const token = localStorage.getItem('auth_token');
      
      const response = await axios.get(`${baseURL}/notifications/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          page: page + 1,
          limit: rowsPerPage,
          status: filters.status || undefined,
          type: filters.type || undefined,
          search: filters.search || undefined
        }
      });
      
      setNotifications(response.data.notifications || []);
      setTotalCount(response.data.totalCount || 0);
      
    } catch (error) {
      console.error('Failed to load notification history:', error);
      
      // Show message that no notification logs are available yet
      setNotifications([]);
      setTotalCount(0);
      
      if (error.response?.status === 404) {
        showSnackbar('No notification history available yet. Notifications will appear here once the logging system is implemented.', 'info');
      } else {
        showSnackbar('Failed to load notification history', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setPage(0); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      type: ''
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <SuccessIcon fontSize="small" />;
      case 'failed': return <ErrorIcon fontSize="small" />;
      case 'pending': return <ScheduleIcon fontSize="small" />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          Notification History
        </Typography>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search by title or recipient"
              value={filters.search}
              onChange={handleFilterChange('search')}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
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
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={handleFilterChange('type')}
                label="Type"
              >
                {typeOptions.map(option => (
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
              <IconButton onClick={loadNotificationHistory} title="Refresh">
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Alert for no notification logging system */}
        {!loading && notifications.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 Notification History Not Available
            </Typography>
            <Typography>
              The notification history feature requires a database table to log notifications. 
              Currently, all shipment notifications are sent automatically, but they are not being logged to the database. 
              To see notification history, the system would need to:
            </Typography>
            <ul>
              <li>Create a notifications table in the database</li>
              <li>Update the notification service to log all sent notifications</li>
              <li>Implement the history API endpoint</li>
            </ul>
            <Typography sx={{ mt: 1, fontWeight: 'bold' }}>
              ✅ All automatic notifications are working correctly without logging.
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
        {!loading && notifications.length > 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Recipients</TableCell>
                  <TableCell>Sent At</TableCell>
                  <TableCell>Success Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {notification.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {notification.body?.substring(0, 50)}...
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={notification.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(notification.status)}
                        label={notification.status?.toUpperCase()}
                        color={getStatusColor(notification.status)}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell>
                      {notification.totalRecipients || 0}
                    </TableCell>
                    
                    <TableCell>
                      {formatDate(notification.sentAt || notification.createdAt)}
                    </TableCell>
                    
                    <TableCell>
                      <Typography 
                        color={notification.failureCount > 0 ? 'error' : 'success'}
                        fontWeight="bold"
                      >
                        {notification.successCount || 0}/{notification.totalRecipients || 0}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {!loading && notifications.length > 0 && (
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

export default NotificationHistory;
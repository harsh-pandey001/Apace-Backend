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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  DeleteForever as DeleteForeverIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { format } from 'date-fns';
import userService from '../services/userService';
import UserDetailsModal from './UserDetailsModal';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

// Column definition
const headCells = [
  { id: 'name', label: 'Name', width: '25%' },
  { id: 'email', label: 'Email', width: '20%' },
  { id: 'phone', label: 'Phone', width: '15%' },
  { id: 'role', label: 'Role', width: '10%' },
  { id: 'status', label: 'Status', width: '10%' },
  { id: 'createdAt', label: 'Registration Date', width: '15%' },
  { id: 'actions', label: 'Actions', width: '5%' },
];

function UserTableHead(props) {
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

UserTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
};

const UserTable = ({ searchTerm, filters, onUserDataChange }) => {
  // State for sorting
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  
  // State for users data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // State for action menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [permanentDeleteLoading, setPermanentDeleteLoading] = useState(false);
  
  // State for user details modal
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // State for all users (unfiltered)
  const [allUsers, setAllUsers] = useState([]);

  // Filter users client-side based on search and filters
  const getFilteredUsers = React.useCallback(() => {
    let filteredUsers = [...allUsers];

    // Exclude admin users from display
    filteredUsers = filteredUsers.filter(user => user.role !== 'admin');

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower)
      );
    }


    // Apply status filter
    if (filters.status) {
      const isActive = filters.status === 'active';
      filteredUsers = filteredUsers.filter(user => user.active === isActive);
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
          filteredUsers = filteredUsers.filter(user => {
            const userDate = new Date(user.createdAt);
            return userDate >= startDate && userDate < endDate;
          });
          return filteredUsers;
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
        filteredUsers = filteredUsers.filter(user => {
          const userDate = new Date(user.createdAt);
          return userDate >= startDate;
        });
      }
    }

    return filteredUsers;
  }, [allUsers, searchTerm, filters]);

  // Get paginated users from filtered results
  const getPaginatedUsers = React.useCallback(() => {
    const filteredUsers = getFilteredUsers();
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [getFilteredUsers, page, rowsPerPage]);

  // Fetch users data from API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all users without server-side filtering since API doesn't support it
      const response = await userService.getAllUsers({
        page: 1,
        limit: 9999, // Get all users for client-side filtering
      });
      
      setAllUsers(response.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when component mounts
  useEffect(() => {
    if (allUsers.length === 0) {
      fetchUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update filtered results when search term, filters, or pagination changes
  useEffect(() => {
    if (allUsers.length > 0) {
      const filteredUsers = getFilteredUsers();
      setUsers(getPaginatedUsers());
      setTotalUsers(filteredUsers.length);
      
      // Reset to first page if current page exceeds available pages
      const maxPages = Math.ceil(filteredUsers.length / rowsPerPage);
      if (page >= maxPages && maxPages > 0) {
        setPage(0);
      }
      
      // Notify parent component about the filtered data for stats
      if (onUserDataChange) {
        const filteredResponse = {
          data: {
            users: filteredUsers
          },
          totalUsers: filteredUsers.length
        };
        onUserDataChange(filteredResponse);
      }
    }
  }, [getFilteredUsers, getPaginatedUsers, page, rowsPerPage, allUsers, onUserDataChange]);

  // Sort the users data based on order and orderBy
  const sortedUsers = React.useMemo(() => {
    if (!users || users.length === 0) return [];
    
    const stabilizedUsers = users.map((user, index) => [user, index]);
    
    stabilizedUsers.sort((a, b) => {
      const userA = a[0];
      const userB = b[0];
      
      // Handle special sorting for name (which is concatenation of firstName and lastName)
      if (orderBy === 'name') {
        const nameA = `${userA.firstName} ${userA.lastName}`.toLowerCase();
        const nameB = `${userB.firstName} ${userB.lastName}`.toLowerCase();
        
        if (order === 'asc') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      }
      
      // Handle date sorting
      if (orderBy === 'createdAt') {
        const dateA = new Date(userA.createdAt);
        const dateB = new Date(userB.createdAt);
        
        if (order === 'asc') {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      }
      
      // Handle other fields
      const valueA = userA[orderBy] || '';
      const valueB = userB[orderBy] || '';
      
      if (order === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
    
    return stabilizedUsers.map((user) => user[0]);
  }, [users, order, orderBy]);

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

  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewUser = (user) => {
    const userToView = user || selectedUser;
    if (!userToView) return;
    
    setSelectedUserId(userToView.id);
    setUserDetailsOpen(true);
    
    // Close menu if it was triggered from the menu
    if (!user) {
      handleMenuClose();
    }
  };



  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    setDeleteLoading(true);
    
    try {
      await userService.deleteUser(selectedUser.id);
      
      // Show success notification
      setSnackbar({
        open: true,
        message: 'User deactivated successfully.',
        severity: 'success'
      });
      
      // Close the delete dialog
      setDeleteDialogOpen(false);
      
      // Reload the data
      fetchUsers();
    } catch (err) {
      console.error('Error deactivating user:', err);
      
      // Show error notification
      setSnackbar({
        open: true,
        message: 'Failed to deactivate user. Please try again.',
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

  const handlePermanentDeleteClick = () => {
    handleMenuClose();
    setPermanentDeleteDialogOpen(true);
  };

  const handlePermanentDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    setPermanentDeleteLoading(true);
    
    try {
      await userService.permanentDeleteUser(selectedUser.id);
      
      // Show success notification
      setSnackbar({
        open: true,
        message: 'User permanently deleted successfully',
        severity: 'success'
      });
      
      // Close the delete dialog
      setPermanentDeleteDialogOpen(false);
      
      // Remove the user from the local state immediately for better UX
      setAllUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUser.id));
      
      // Reload the data to ensure consistency
      fetchUsers();
    } catch (err) {
      console.error('Error permanently deleting user:', err);
      
      // Show error notification
      setSnackbar({
        open: true,
        message: 'Failed to permanently delete user. Please try again.',
        severity: 'error'
      });
      
      // Close the delete dialog
      setPermanentDeleteDialogOpen(false);
    } finally {
      setPermanentDeleteLoading(false);
    }
  };

  const handlePermanentDeleteCancel = () => {
    setPermanentDeleteDialogOpen(false);
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    
    try {
      await userService.updateUser(selectedUser.id, {
        active: !selectedUser.active
      });
      fetchUsers(); // Reload the data
      handleMenuClose();
    } catch (err) {
      console.error('Error updating user status:', err);
      // Show error notification
      setError('Failed to update user status. Please try again.');
      handleMenuClose();
    }
  };

  const handleRefresh = () => {
    fetchUsers();
  };
  
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleUserDetailsClose = () => {
    setUserDetailsOpen(false);
    setSelectedUserId(null);
    
    // Refresh users to show latest changes
    fetchUsers();
  };

  const getStatusColor = (status) => {
    return status ? 'success' : 'error';
  };

  const getStatusIcon = (status) => {
    return status ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#e74c3c';
      case 'driver':
        return '#f39c12';
      default:
        return '#3498db';
    }
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
        aria-label="Users data table"
        role="region"
        aria-roledescription="User management table"
      >
        {/* Accessibility: Add a caption for screen readers */}
        <caption style={{ position: 'absolute', left: '-9999px', height: '1px', overflow: 'hidden' }}>
          Table of users with information including name, email, phone, role, status, and registration date
        </caption>
        
        <Table stickyHeader aria-label="users table" size="medium">
          <UserTableHead
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
          />
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Loading users...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : sortedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Typography variant="body1">
                    No users found
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
              sortedUsers.map((user) => (
                <TableRow
                  hover
                  key={user.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  aria-label={`User ${user.firstName} ${user.lastName}`}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          mr: 2, 
                          bgcolor: getRoleColor(user.role),
                          width: 40,
                          height: 40
                        }}
                      >
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1">{user.firstName} {user.lastName}</Typography>
                        <Typography variant="body2" color="text.secondary">{user.id}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      size="small"
                      sx={{
                        bgcolor: getRoleColor(user.role),
                        color: 'white',
                        textTransform: 'capitalize'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={getStatusIcon(user.active)}
                      label={user.active ? 'Active' : 'Inactive'} 
                      color={getStatusColor(user.active)} 
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          aria-label="view user details"
                          size="small"
                          color="primary"
                          onClick={() => handleViewUser(user)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        aria-label="more options"
                        size="small"
                        onClick={(e) => handleMenuClick(e, user)}
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
        count={totalUsers}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelDisplayedRows={({ from, to, count }) => {
          return `Showing ${from}–${to} of ${count !== -1 ? count : `more than ${to}`} users`;
        }}
        labelRowsPerPage="Users per page:"
        aria-label="User table pagination"
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleToggleStatus}>
          {selectedUser?.active ? (
            <>
              <BlockIcon fontSize="small" sx={{ mr: 1 }} />
              Deactivate User
            </>
          ) : (
            <>
              <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
              Activate User
            </>
          )}
        </MenuItem>
        <MenuItem onClick={handlePermanentDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteForeverIcon fontSize="small" sx={{ mr: 1 }} />
          Permanently Delete
        </MenuItem>
      </Menu>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        entityName="User"
        confirmationText={selectedUser ? `Are you sure you want to deactivate ${selectedUser.firstName} ${selectedUser.lastName}? This will disable their account but keep their data.` : ''}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
      
      {/* Permanent Delete Confirmation Dialog */}
      <Dialog open={permanentDeleteDialogOpen} onClose={handlePermanentDeleteCancel}>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center' }}>
          <DeleteForeverIcon sx={{ mr: 1 }} />
          Permanently Delete User
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedUser && (
              <>
                Are you sure you want to permanently delete <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>?
                <br /><br />
                <strong>⚠️ WARNING:</strong> This action cannot be undone. All user data including:
                <br />• Personal information
                <br />• Order history  
                <br />• Account settings
                <br />• All associated records
                <br /><br />
                will be permanently removed from the system.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePermanentDeleteCancel} disabled={permanentDeleteLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handlePermanentDeleteConfirm}
            color="error"
            variant="contained"
            disabled={permanentDeleteLoading}
            startIcon={permanentDeleteLoading ? <CircularProgress size={16} /> : <DeleteForeverIcon />}
          >
            {permanentDeleteLoading ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* User Details Modal */}
      <UserDetailsModal
        open={userDetailsOpen}
        userId={selectedUserId}
        onClose={handleUserDetailsClose}
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

UserTable.propTypes = {
  searchTerm: PropTypes.string,
  filters: PropTypes.object,
  onUserDataChange: PropTypes.func,
};

UserTable.defaultProps = {
  searchTerm: '',
  filters: {},
};

export default UserTable;
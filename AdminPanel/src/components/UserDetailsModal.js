import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import UserDetailsCard from './UserDetailsCard';
import userService from '../services/userService';

/**
 * UserDetailsModal component for displaying and managing user details
 */
const UserDetailsModal = ({ open, userId, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch user details when the modal opens and a userId is provided
  useEffect(() => {
    if (open && userId) {
      fetchUserDetails(userId);
    }
  }, [open, userId]);

  // Function to fetch user details
  const fetchUserDetails = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userService.getUserById(id);
      setUser(response.data.user);
    } catch (err) {
      console.error('Error fetching user details:', err);
      
      if (err.response && err.response.status === 404) {
        setError('User not found. The user may have been deleted.');
      } else {
        setError('Failed to load user details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle toggling user status (active/inactive)
  const handleToggleStatus = async () => {
    if (!user) return;
    
    try {
      const newStatus = !user.active;
      await userService.updateUser(user.id, { active: newStatus });
      
      // Update the local user state
      setUser({
        ...user,
        active: newStatus,
      });
      
      // Show success message
      setSnackbar({
        open: true,
        message: `User ${newStatus ? 'activated' : 'deactivated'} successfully.`,
        severity: 'success',
      });
    } catch (err) {
      console.error('Error updating user status:', err);
      
      // Show error message
      setSnackbar({
        open: true,
        message: 'Failed to update user status. Please try again.',
        severity: 'error',
      });
    }
  };

  // Handle the view shipments action
  const handleViewShipments = () => {
    if (!user) return;
    
    // This could navigate to a filtered shipments page or open another modal
    console.log('View shipments for user:', user.id);
    
    // Close this modal
    onClose();
    
    // This implementation would depend on app navigation, could redirect to the shipments page
    // with a filter for this user.id
    // For example: history.push(`/shipments?userId=${user.id}`);
  };

  // Handle closing the snackbar
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle modal close event
  const handleClose = () => {
    setUser(null);
    setError(null);
    onClose();
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        aria-labelledby="user-details-title"
      >
        <DialogTitle id="user-details-title" sx={{ m: 0, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="span">
              User Details
            </Typography>
          </Box>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <UserDetailsCard
            user={user}
            loading={loading}
            error={error}
            onToggleStatus={handleToggleStatus}
            onViewShipments={handleViewShipments}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for success/error messages */}
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

UserDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  userId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default UserDetailsModal;
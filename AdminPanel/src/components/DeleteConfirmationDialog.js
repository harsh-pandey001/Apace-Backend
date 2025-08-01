import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

/**
 * Generic confirmation dialog for delete operations
 */
const DeleteConfirmationDialog = ({
  open,
  title,
  entityName,
  confirmationText,
  onCancel,
  onConfirm,
  loading
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      aria-labelledby="delete-confirmation-title"
      aria-describedby="delete-confirmation-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="delete-confirmation-title">
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <WarningIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="span">
            {title || `Delete ${entityName}`}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-confirmation-description">
          {confirmationText || `Are you sure you want to delete this ${entityName.toLowerCase()}? This action cannot be undone.`}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onCancel} 
          disabled={loading}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

DeleteConfirmationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  entityName: PropTypes.string.isRequired,
  confirmationText: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

DeleteConfirmationDialog.defaultProps = {
  loading: false,
  title: '',
  confirmationText: ''
};

export default DeleteConfirmationDialog;
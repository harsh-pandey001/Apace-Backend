import React from 'react';
import { Chip } from '@mui/material';
import {
  HourglassEmpty as PendingIcon,
  CheckCircle as VerifiedIcon,
  Cancel as RejectedIcon
} from '@mui/icons-material';

const DocumentStatusChip = ({ status, size = 'small', variant = 'filled' }) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'warning',
          icon: <PendingIcon />,
          sx: { backgroundColor: '#fff3cd', color: '#856404' }
        };
      case 'verified':
        return {
          label: 'Verified',
          color: 'success',
          icon: <VerifiedIcon />,
          sx: { backgroundColor: '#d4edda', color: '#155724' }
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'error',
          icon: <RejectedIcon />,
          sx: { backgroundColor: '#f8d7da', color: '#721c24' }
        };
      default:
        return {
          label: 'Unknown',
          color: 'default',
          icon: null,
          sx: {}
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant={variant}
      icon={config.icon}
      sx={{
        fontWeight: 500,
        ...config.sx
      }}
    />
  );
};

export default DocumentStatusChip;
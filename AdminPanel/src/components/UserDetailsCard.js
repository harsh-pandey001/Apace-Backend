import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Divider,
  Grid,
  Chip,
  Avatar,
  Skeleton,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  PlaylistAdd as ShipmentsIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

/**
 * UserDetailsCard component displays detailed information about a user
 */
const UserDetailsCard = ({ 
  user, 
  loading, 
  error, 
  onEdit, 
  onToggleStatus, 
  onViewShipments 
}) => {
  // Format the date to a readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return format(new Date(dateString), 'PP p'); // e.g. Apr 29, 2023 12:34 PM
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Get the initials for the avatar
  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
  };

  // Get color for the role badge
  const getRoleColor = (role) => {
    if (!role) return 'default';
    switch (role.toLowerCase()) {
      case 'admin':
        return 'error';
      case 'driver':
        return 'warning';
      case 'user':
        return 'info';
      default:
        return 'default';
    }
  };

  // Get status color
  const getStatusColor = (active) => {
    return active ? 'success' : 'error';
  };

  // Show skeletons while loading
  if (loading) {
    return (
      <Card elevation={3}>
        <CardHeader
          avatar={<Skeleton variant="circular" width={40} height={40} />}
          title={<Skeleton variant="text" width="60%" />}
          subheader={<Skeleton variant="text" width="40%" />}
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Grid item xs={12} key={item}>
                <Skeleton variant="text" height={30} />
                <Skeleton variant="text" width="80%" />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  // Show error message
  if (error) {
    return (
      <Card elevation={3}>
        <CardHeader title="Error Loading User" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no user data
  if (!user) {
    return (
      <Card elevation={3}>
        <CardHeader title="No User Selected" />
        <CardContent>
          <Typography>Please select a user to view details.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={3}>
      {/* Card Header with User Name and Actions */}
      <CardHeader
        avatar={
          <Avatar
            sx={{
              bgcolor: getRoleColor(user.role),
              width: 56,
              height: 56,
              fontSize: '1.5rem',
            }}
          >
            {getInitials()}
          </Avatar>
        }
        title={
          <Typography variant="h5">
            {user.firstName} {user.lastName}
          </Typography>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            {/* Role Badge - Hide for Admin */}
            {user.role && user.role.toLowerCase() !== 'admin' && (
              <Chip
                label={user.role}
                color={getRoleColor(user.role)}
                size="small"
                sx={{ textTransform: 'capitalize' }}
              />
            )}
            
            {/* Status Badge */}
            <Chip
              label={user.active ? 'Active' : 'Inactive'}
              color={getStatusColor(user.active)}
              size="small"
              variant="outlined"
              icon={user.active ? <CheckCircleIcon /> : <BlockIcon />}
            />
          </Box>
        }
        action={
          <Box>
            {onEdit && (
              <Tooltip title="Edit User">
                <IconButton onClick={onEdit} size="small" sx={{ mr: 1 }}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        }
      />
      <Divider />
      
      {/* User Details Content */}
      <CardContent>
        <Grid container spacing={3}>
          {/* User ID */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              User ID
            </Typography>
            <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
              {user.id}
            </Typography>
          </Grid>
          
          {/* Email */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
              {user.email}
            </Typography>
          </Grid>
          
          {/* Phone */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                Phone
              </Typography>
            </Box>
            <Typography variant="body1">
              {user.phone}
            </Typography>
          </Grid>
          
          {/* Created At */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                Account Created
              </Typography>
            </Box>
            <Typography variant="body1">
              {formatDate(user.createdAt)}
            </Typography>
          </Grid>
          
          {/* Updated At */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                Last Updated
              </Typography>
            </Box>
            <Typography variant="body1">
              {formatDate(user.updatedAt)}
            </Typography>
          </Grid>
        </Grid>
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          {onToggleStatus && (
            <Button
              variant="outlined"
              color={user.active ? "error" : "success"}
              startIcon={user.active ? <BlockIcon /> : <CheckCircleIcon />}
              onClick={onToggleStatus}
              sx={{ flexGrow: 1, mr: 1 }}
            >
              {user.active ? 'Disable Account' : 'Enable Account'}
            </Button>
          )}
          
          {onViewShipments && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ShipmentsIcon />}
              onClick={onViewShipments}
              sx={{ flexGrow: 1, ml: onToggleStatus ? 1 : 0 }}
            >
              View Shipments
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

UserDetailsCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    role: PropTypes.string,
    active: PropTypes.bool,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onEdit: PropTypes.func,
  onToggleStatus: PropTypes.func,
  onViewShipments: PropTypes.func,
};

UserDetailsCard.defaultProps = {
  loading: false,
  error: null,
};

export default UserDetailsCard;
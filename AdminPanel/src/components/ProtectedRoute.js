import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protected route component that checks for authentication
 * Redirects to login if not authenticated
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check if the user is authenticated
  if (!isAuthenticated) {
    // Redirect to login page and save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin-only route, check for admin role
  if (adminOnly && !isAdmin) {
    // Redirect to dashboard with unauthorized message
    return <Navigate to="/dashboard" state={{ unauthorized: true }} replace />;
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;
import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Link } from 'react-router-dom';
import UserRoleChart from '../components/charts/UserRoleChart';
import ShipmentStatusChart from '../components/charts/ShipmentStatusChart';
import ShipmentTrendsChart from '../components/charts/ShipmentTrendsChart';
import NewUsersChart from '../components/charts/NewUsersChart';
import useDashboardData from '../hooks/useDashboardData';
import { formatDate } from '../services/shipmentService';

function Dashboard() {
  // Use our custom hook to fetch all dashboard data
  const { 
    loading, 
    error, 
    shipments, 
    shipmentMetrics,
    userMetrics,
    refreshData 
  } = useDashboardData(30000); // Refresh every 30 seconds

  // Get only the most recent 5 shipments for the table
  const recentShipments = shipments.slice(0, 5);

  // Sample data for recent activities
  const recentActivities = [
    { id: 1, action: 'New user registered', user: 'John Doe', time: '2 minutes ago', status: 'success' },
    { id: 2, action: 'Shipment delivered', shipmentId: '#1234', time: '15 minutes ago', status: 'success' },
    { id: 3, action: 'Shipment cancelled', shipmentId: '#5678', time: '1 hour ago', status: 'error' },
    { id: 4, action: 'Payment received', amount: '$234.50', time: '2 hours ago', status: 'success' },
    { id: 5, action: 'Driver assigned', driverId: 'D123', time: '3 hours ago', status: 'info' },
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'success':
        return 'success';
      case 'in-transit':
      case 'info':
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  // Create dashboard cards based on metrics
  const dashboardCards = [
    {
      title: 'Total Users',
      value: loading ? '-' : userMetrics.totalUsers,
      color: '#3498db',
      icon: '👥'
    },
    {
      title: 'Total Shipments',
      value: loading ? '-' : shipmentMetrics.totalShipments,
      color: '#2ecc71',
      icon: '📦'
    },
    {
      title: 'Pending Shipments',
      value: loading ? '-' : shipmentMetrics.pendingShipments,
      color: '#f39c12',
      icon: '⏳'
    },
    {
      title: 'Delivered Shipments',
      value: loading ? '-' : shipmentMetrics.completedShipments,
      color: '#9b59b6',
      icon: '✅'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Welcome back! Here's what's happening with your business today.
      </Typography>

      {/* Dashboard Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                borderTop: `4px solid ${card.color}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {loading ? <CircularProgress size={24} /> : card.value}
                </Typography>
                <Box
                  sx={{
                    fontSize: '2rem',
                    p: 1,
                    borderRadius: '50%',
                    bgcolor: `${card.color}20`,
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
              <Typography color="text.secondary" sx={{ mt: 'auto' }}>
                {card.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Business Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Key metrics and trends to help you make data-driven decisions.
        </Typography>
        <Divider sx={{ mb: 3 }} />
      </Box>

      {/* First Row of Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          {loading ? (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
            </Paper>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <UserRoleChart roleDistribution={userMetrics.roleDistribution} />
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          {loading ? (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
            </Paper>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <ShipmentStatusChart shipments={shipments} />
          )}
        </Grid>
      </Grid>

      {/* Second Row of Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          {loading ? (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
            </Paper>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <NewUsersChart newUsersPerDay={userMetrics.newUsersPerDay} />
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          {loading ? (
            <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
            </Paper>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <ShipmentTrendsChart shipments={shipments} />
          )}
        </Grid>
      </Grid>

      {/* Recent Activity Section */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Stay updated with the latest events and transactions in the system.
        </Typography>
        <Divider sx={{ mb: 3 }} />
      </Box>

      {/* Activity Grid */}
      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>{activity.user || activity.shipmentId || activity.amount || activity.driverId}</TableCell>
                      <TableCell>{activity.time}</TableCell>
                      <TableCell>
                        <Chip
                          label={activity.status}
                          color={getStatusColor(activity.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Shipments */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Shipments
              </Typography>
              <Button
                component={Link}
                to="/shipments"
                color="primary"
                size="small"
              >
                View All
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : recentShipments.length === 0 ? (
              <Alert severity="info">No recent shipments found.</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tracking #</TableCell>
                      <TableCell>Route</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentShipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>{shipment.trackingNumber}</TableCell>
                        <TableCell>{`${shipment.pickupAddress?.substring(0, 10)}... → ${shipment.deliveryAddress?.substring(0, 10)}...`}</TableCell>
                        <TableCell>
                          {shipment.user ? `${shipment.user.firstName} ${shipment.user.lastName}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={shipment.status}
                            color={getStatusColor(shipment.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary">
                    98%
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    On-Time Delivery
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="secondary">
                    4.8
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Average Rating
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="warning.main">
                    {loading ? '-' : userMetrics.roleDistribution?.driver || 0}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Active Drivers
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="info.main">
                    24
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Pending Reviews
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
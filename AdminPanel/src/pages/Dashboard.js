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
  useTheme,
} from '@mui/material';
import DashboardCards from '../components/DashboardCards';

// Sample data for recent activities
const recentActivities = [
  { id: 1, action: 'New user registered', user: 'John Doe', time: '2 minutes ago', status: 'success' },
  { id: 2, action: 'Shipment delivered', shipmentId: '#1234', time: '15 minutes ago', status: 'success' },
  { id: 3, action: 'Booking cancelled', bookingId: '#5678', time: '1 hour ago', status: 'error' },
  { id: 4, action: 'Payment received', amount: '$234.50', time: '2 hours ago', status: 'success' },
  { id: 5, action: 'Driver assigned', driverId: 'D123', time: '3 hours ago', status: 'info' },
];

// Sample data for recent shipments
const recentShipments = [
  { id: '#1234', from: 'New York', to: 'Boston', status: 'delivered', driver: 'Mike Johnson' },
  { id: '#1235', from: 'Chicago', to: 'Detroit', status: 'in-transit', driver: 'Sarah Wilson' },
  { id: '#1236', from: 'Los Angeles', to: 'San Francisco', status: 'pending', driver: 'Not assigned' },
  { id: '#1237', from: 'Miami', to: 'Orlando', status: 'in-transit', driver: 'Tom Brown' },
  { id: '#1238', from: 'Seattle', to: 'Portland', status: 'delivered', driver: 'Lisa Davis' },
];

function Dashboard() {
  const theme = useTheme();

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
      case 'success':
        return 'success';
      case 'in-transit':
      case 'info':
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Welcome back! Here's what's happening with your business today.
      </Typography>

      {/* Dashboard Cards */}
      <DashboardCards />

      {/* Content Grid */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
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
                      <TableCell>{activity.user || activity.shipmentId || activity.bookingId || activity.amount || activity.driverId}</TableCell>
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
            <Typography variant="h6" gutterBottom>
              Recent Shipments
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Driver</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell>{shipment.id}</TableCell>
                      <TableCell>{`${shipment.from} → ${shipment.to}`}</TableCell>
                      <TableCell>
                        <Chip
                          label={shipment.status}
                          color={getStatusColor(shipment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{shipment.driver}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
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
                    152
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
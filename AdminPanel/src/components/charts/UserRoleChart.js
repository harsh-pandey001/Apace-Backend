import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader, Box, Typography, useTheme } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

/**
 * Component for displaying user role distribution in a doughnut chart
 */
const UserRoleChart = ({ roleDistribution }) => {
  const theme = useTheme();
  
  // Format for better display names
  const formatRoleName = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Define colors for each role
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

  // Prepare data for Chart.js
  const chartData = {
    labels: Object.keys(roleDistribution).map(formatRoleName),
    datasets: [
      {
        data: Object.values(roleDistribution),
        backgroundColor: Object.keys(roleDistribution).map(getRoleColor),
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            family: theme.typography.fontFamily,
            size: 12,
          },
          color: theme.palette.text.primary,
          boxWidth: 15,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Calculate total users
  const totalUsers = Object.values(roleDistribution).reduce((a, b) => a + b, 0);

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader 
        title="User Roles Distribution" 
        subheader={`Total: ${totalUsers} users`}
        titleTypographyProps={{ variant: 'h6' }}
        subheaderTypographyProps={{ variant: 'body2' }}
      />
      <CardContent>
        <Box sx={{ height: 300, position: 'relative' }}>
          <Doughnut data={chartData} options={chartOptions} />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '43%', // Adjusted for legend on right
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Total Users
            </Typography>
            <Typography variant="h4">{totalUsers}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

UserRoleChart.propTypes = {
  roleDistribution: PropTypes.object.isRequired,
};

export default UserRoleChart;
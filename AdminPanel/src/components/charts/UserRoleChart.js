import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader, Box, Typography, useTheme } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

// Format for better display names
const formatRoleName = (role) => {
  switch (role) {
    case 'user':
      return 'Customer';
    case 'driver':
      return 'Driver';
    case 'admin':
      return 'Admin';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

// Define colors for each role
const getRoleColor = (role) => {
  switch (role) {
    case 'admin':
      return '#e74c3c';
    case 'driver':
      return '#f39c12';
    case 'user':
    default:
      return '#3498db';
  }
};

/**
 * Component for displaying user role distribution in a doughnut chart
 */
const UserRoleChart = React.memo(({ roleDistribution }) => {
  const theme = useTheme();

  // Memoize the processed role distribution data
  const processedData = useMemo(() => {
    const safeRoleDistribution = roleDistribution && Object.keys(roleDistribution).length > 0 
      ? roleDistribution 
      : { user: 0, driver: 0, admin: 0 };
    
    const totalUsers = Object.values(safeRoleDistribution).reduce((a, b) => a + b, 0);
    
    return {
      roleDistribution: safeRoleDistribution,
      totalUsers,
      hasData: totalUsers > 0
    };
  }, [roleDistribution]);

  // Memoize chart data to prevent unnecessary Chart.js re-renders
  const chartData = useMemo(() => {
    const { roleDistribution: data } = processedData;
    
    return {
      labels: Object.keys(data).map(formatRoleName),
      datasets: [
        {
          data: Object.values(data),
          backgroundColor: Object.keys(data).map(getRoleColor),
          borderColor: theme.palette.background.paper,
          borderWidth: 2,
          // Add animation disable for better performance
          animation: {
            duration: 300, // Reduced from default 1000ms
          },
        },
      ],
    };
  }, [processedData, theme.palette.background.paper]);

  // Memoize chart options to prevent recreation on every render
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    // Disable animations for better performance
    animation: {
      duration: 300,
    },
    // Optimize hover interactions
    interaction: {
      intersect: false,
      mode: 'nearest',
    },
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
          // Optimize legend rendering
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                return {
                  text: `${label}: ${value}`,
                  fillStyle: dataset.backgroundColor[i],
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  }), [theme.typography.fontFamily, theme.palette.text.primary]);

  // Don't render chart if no data
  if (!processedData.hasData) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader 
          title="User Roles Distribution" 
          subheader="No user data available"
          titleTypographyProps={{ variant: 'h6' }}
          subheaderTypographyProps={{ variant: 'body2' }}
        />
        <CardContent>
          <Box sx={{ 
            height: 300, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Typography variant="body2" color="text.secondary">
              No users to display
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title="User Roles Distribution" 
        subheader={`Total: ${processedData.totalUsers} users`}
        titleTypographyProps={{ variant: 'h6' }}
        subheaderTypographyProps={{ variant: 'body2' }}
      />
      <CardContent>
        <Box sx={{ height: 300, position: 'relative' }}>
          <Doughnut 
            data={chartData} 
            options={chartOptions}
            // Add key to force re-render only when data actually changes
            key={JSON.stringify(processedData.roleDistribution)}
          />
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
            <Typography variant="h4">{processedData.totalUsers}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

// Add display name for debugging
UserRoleChart.displayName = 'UserRoleChart';

UserRoleChart.propTypes = {
  roleDistribution: PropTypes.object.isRequired,
};

export default UserRoleChart;
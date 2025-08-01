import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader, Box, useTheme } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, Title);

/**
 * Component for displaying shipment status distribution in a doughnut chart
 */
const ShipmentStatusChart = ({ shipments }) => {
  const theme = useTheme();
  
  // Count shipments by status
  const countByStatus = shipments.reduce((acc, shipment) => {
    const status = shipment.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  // Format for better display names
  const formatStatusName = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Define colors for each status
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#2ecc71'; // Green
      case 'in-transit':
        return '#3498db'; // Blue
      case 'pending':
        return '#f39c12'; // Orange
      case 'cancelled':
        return '#e74c3c'; // Red
      default:
        return '#95a5a6'; // Gray
    }
  };

  // Prepare data for Chart.js
  const chartData = {
    labels: Object.keys(countByStatus).map(formatStatusName),
    datasets: [
      {
        data: Object.values(countByStatus),
        backgroundColor: Object.keys(countByStatus).map(getStatusColor),
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

  // Calculate total shipments
  const totalShipments = Object.values(countByStatus).reduce((a, b) => a + b, 0);

  return (
    <Card sx={{ mb: 3, height: '100%' }}>
      <CardHeader 
        title="Shipment Status Distribution" 
        subheader={`Total: ${totalShipments} shipments`}
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
            <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
              Total
            </Box>
            <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {totalShipments}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

ShipmentStatusChart.propTypes = {
  shipments: PropTypes.array.isRequired,
};

export default ShipmentStatusChart;
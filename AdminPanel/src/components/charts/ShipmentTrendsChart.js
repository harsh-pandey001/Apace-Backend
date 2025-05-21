import React from 'react';
import PropTypes from 'prop-types';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  Title, 
  Tooltip, 
  Legend,
  Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, Box, useTheme } from '@mui/material';
import { format, subDays, parseISO } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Component for displaying shipment trends as a line chart
 */
const ShipmentTrendsChart = ({ shipments }) => {
  const theme = useTheme();

  // Process shipments data to show new shipments per day (last 7 days)
  const processShipmentTrends = () => {
    const today = new Date();
    const result = [];
    const labels = [];
    
    // Create an array of the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const displayDate = format(date, 'MMM dd');
      
      labels.push(displayDate);
      
      // Count shipments created on this date
      const count = shipments.filter(shipment => {
        if (!shipment.createdAt) return false;
        const createdDate = typeof shipment.createdAt === 'string' 
          ? parseISO(shipment.createdAt) 
          : new Date(shipment.createdAt);
        return format(createdDate, 'yyyy-MM-dd') === formattedDate;
      }).length;
      
      result.push(count);
    }
    
    return { labels, data: result };
  };

  const { labels, data } = processShipmentTrends();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'New Shipments',
        data,
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}20`,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: theme.typography.fontFamily,
            size: 12
          },
          color: theme.palette.text.primary
        }
      },
      tooltip: {
        backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
        titleColor: theme.palette.mode === 'dark' ? '#fff' : '#333',
        bodyColor: theme.palette.mode === 'dark' ? '#eee' : '#555',
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: {
          family: theme.typography.fontFamily,
        },
        bodyFont: {
          family: theme.typography.fontFamily,
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: theme.palette.divider,
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            family: theme.typography.fontFamily,
          },
          stepSize: 1,
          precision: 0
        }
      }
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title="New Shipments (Last 7 Days)" 
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        <Box sx={{ height: 300 }}>
          <Line options={options} data={chartData} />
        </Box>
      </CardContent>
    </Card>
  );
};

ShipmentTrendsChart.propTypes = {
  shipments: PropTypes.array.isRequired,
};

export default ShipmentTrendsChart;
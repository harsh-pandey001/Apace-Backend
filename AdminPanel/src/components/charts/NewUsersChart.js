import React from 'react';
import PropTypes from 'prop-types';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, Box, useTheme } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Component for displaying new users per day as a bar chart
 */
const NewUsersChart = ({ newUsersPerDay }) => {
  const theme = useTheme();

  // Prepare data for Chart.js
  const chartData = {
    labels: newUsersPerDay.map(day => day.displayDate),
    datasets: [
      {
        label: 'New Users',
        data: newUsersPerDay.map(day => day.count),
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.dark,
        borderWidth: 1,
        borderRadius: 4,
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
          display: false
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
        title="New Users (Last 7 Days)" 
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        <Box sx={{ height: 300 }}>
          <Bar options={options} data={chartData} />
        </Box>
      </CardContent>
    </Card>
  );
};

NewUsersChart.propTypes = {
  newUsersPerDay: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      displayDate: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired
    })
  ).isRequired,
};

export default NewUsersChart;
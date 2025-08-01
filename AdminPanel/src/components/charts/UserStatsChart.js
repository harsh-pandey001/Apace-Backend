import React from 'react';
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
import { Box, Paper, Typography, useTheme } from '@mui/material';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Sample data for user statistics
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const userStatsData = {
  labels: months,
  datasets: [
    {
      label: 'Regular Users',
      data: months.map(() => Math.floor(Math.random() * 80) + 20), // 20-100 users per month
      backgroundColor: '#3498db',
    },
    {
      label: 'Driver Users',
      data: months.map(() => Math.floor(Math.random() * 50) + 10), // 10-60 drivers per month
      backgroundColor: '#f39c12',
    },
    {
      label: 'Admin Users',
      data: months.map(() => Math.floor(Math.random() * 5) + 1), // 1-6 admins per month
      backgroundColor: '#2ecc71',
    },
  ],
};

const UserStatsChart = () => {
  const theme = useTheme();

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
      title: {
        display: false,
        text: 'Monthly User Types Distribution',
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
          }
        },
        stacked: false
      }
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        User Distribution by Type
      </Typography>
      <Box sx={{ height: 350 }}>
        <Bar options={options} data={userStatsData} />
      </Box>
    </Paper>
  );
};

export default UserStatsChart;
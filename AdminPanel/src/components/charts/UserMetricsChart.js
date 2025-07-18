import React, { useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler 
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { Box, Paper, Typography, ToggleButtonGroup, ToggleButton, useTheme } from '@mui/material';
import { format, subDays, subMonths } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Sample data for user metrics
const generateUserSignups = (period) => {
  const today = new Date();
  let dates = [];
  let data = [];
  let labels = [];

  if (period === 'daily') {
    // Last 7 days
    dates = Array.from({ length: 7 }, (_, i) => subDays(today, i)).reverse();
    labels = dates.map(date => format(date, 'MMM dd'));
    data = dates.map(() => Math.floor(Math.random() * 15) + 5); // 5-20 signups per day
  } else if (period === 'weekly') {
    // Last 8 weeks
    dates = Array.from({ length: 8 }, (_, i) => subDays(today, i * 7)).reverse();
    labels = dates.map(date => `Week of ${format(date, 'MMM dd')}`);
    data = dates.map(() => Math.floor(Math.random() * 70) + 30); // 30-100 signups per week
  } else if (period === 'monthly') {
    // Last 6 months
    dates = Array.from({ length: 6 }, (_, i) => subMonths(today, i)).reverse();
    labels = dates.map(date => format(date, 'MMM yyyy'));
    data = dates.map(() => Math.floor(Math.random() * 300) + 100); // 100-400 signups per month
  }

  return { labels, data };
};

// Sample data for active vs inactive users
const activeInactiveUsersData = {
  labels: ['Active Users', 'Inactive Users'],
  datasets: [
    {
      data: [1050, 184],
      backgroundColor: ['#2ecc71', '#e74c3c'],
      borderColor: ['#229954', '#c0392b'],
      borderWidth: 1,
    },
  ],
};

const UserMetricsChart = () => {
  const theme = useTheme();
  const [timePeriod, setTimePeriod] = useState('daily');
  
  const handleTimePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setTimePeriod(newPeriod);
    }
  };

  const { labels, data } = generateUserSignups(timePeriod);

  const signupData = {
    labels,
    datasets: [
      {
        label: 'New User Signups',
        data,
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(52, 152, 219, 0.2)' 
          : 'rgba(52, 152, 219, 0.1)',
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
      title: {
        display: false,
        text: 'User Signups',
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
          }
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
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
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">User Signups</Typography>
          <ToggleButtonGroup
            value={timePeriod}
            exclusive
            onChange={handleTimePeriodChange}
            size="small"
            color="primary"
          >
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ height: 300 }}>
          <Line options={options} data={signupData} />
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Active vs. Inactive Users
        </Typography>
        <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ width: '70%', height: '100%' }}>
            <Pie options={pieOptions} data={activeInactiveUsersData} />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default UserMetricsChart;
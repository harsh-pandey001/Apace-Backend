import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalShipping as ShippingIcon,
  BookOnline as BookingIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

const dashboardCards = [
  {
    title: 'Total Users',
    value: '1,234',
    icon: <PeopleIcon />,
    color: '#3498db',
    trend: 'up',
    trendValue: '12%',
    trendText: 'from last month',
  },
  {
    title: 'Active Shipments',
    value: '456',
    icon: <ShippingIcon />,
    color: '#2ecc71',
    trend: 'up',
    trendValue: '8%',
    trendText: 'from last week',
  },
  {
    title: 'Completed Bookings',
    value: '789',
    icon: <BookingIcon />,
    color: '#f39c12',
    trend: 'down',
    trendValue: '5%',
    trendText: 'from yesterday',
  },
  {
    title: 'Revenue',
    value: '$45,678',
    icon: <MoneyIcon />,
    color: '#e74c3c',
    trend: 'up',
    trendValue: '15%',
    trendText: 'from last month',
  },
];

function DashboardCards() {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      {dashboardCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: card.color,
                    color: 'white',
                  }}
                >
                  {card.icon}
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography color="text.secondary" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" component="div">
                    {card.value}
                  </Typography>
                </Box>
              </Box>
              
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: card.trend === 'up' ? 'success.main' : 'error.main',
                }}
              >
                {card.trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                <Typography variant="body2" component="span">
                  {card.trendValue}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.trendText}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default DashboardCards;
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  LocalShipping as ShippingIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CompletedIcon,
  HourglassTop as PendingIcon,
} from '@mui/icons-material';
import { getAdminShipments, calculateShipmentMetrics } from '../services/shipmentService';

function DashboardCards() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalShipments: 0,
    pendingShipments: 0,
    completedShipments: 0,
    totalRevenue: 0,
    topUser: null
  });

  // Fetch shipments data for metrics
  useEffect(() => {
    const fetchShipmentMetrics = async () => {
      try {
        const result = await getAdminShipments();
        const shipmentMetrics = calculateShipmentMetrics(result.data.shipments);
        setMetrics(shipmentMetrics);
      } catch (error) {
        console.error('Error fetching shipment metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShipmentMetrics();
  }, []);

  // Define the dashboard card data array based on metrics
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
      value: loading ? '-' : metrics.totalShipments,
      icon: <ShippingIcon />,
      color: '#2ecc71',
      trend: 'up',
      trendValue: '8%',
      trendText: 'from last week',
    },
    {
      title: 'Pending Shipments',
      value: loading ? '-' : metrics.pendingShipments,
      icon: <PendingIcon />,
      color: '#f39c12',
      trend: metrics.pendingShipments > 5 ? 'up' : 'down',
      trendValue: metrics.pendingShipments > 5 ? '15%' : '5%',
      trendText: 'from yesterday',
    },
    {
      title: 'Completed Shipments',
      value: loading ? '-' : metrics.completedShipments,
      icon: <CompletedIcon />,
      color: '#9b59b6',
      trend: 'up',
      trendValue: '10%',
      trendText: 'from last week',
    },
    {
      title: 'Total Revenue',
      value: loading ? '-' : `$${metrics.totalRevenue}`,
      icon: <MoneyIcon />,
      color: '#e74c3c',
      trend: 'up',
      trendValue: '15%',
      trendText: 'from last month',
    },
  ];

  return (
    <Grid container spacing={3}>
      {dashboardCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme.shadows[8],
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
                  {loading && (card.title.includes('Shipment') || card.title.includes('Revenue')) ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Typography variant="h4" component="div">
                      {card.value}
                    </Typography>
                  )}
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
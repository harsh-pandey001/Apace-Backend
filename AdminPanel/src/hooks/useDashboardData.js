import { useState, useEffect, useCallback } from 'react';
import { getAdminShipments, calculateShipmentMetrics } from '../services/shipmentService';
import userService from '../services/userService';
import { format, subDays, parseISO } from 'date-fns';

/**
 * Custom hook to fetch and process all dashboard data
 * @param {number} refreshInterval - Milliseconds to wait before refreshing data (0 to disable)
 * @returns {Object} Dashboard data and loading states
 */
const useDashboardData = (refreshInterval = 0) => {
  const [shipments, setShipments] = useState([]);
  const [users, setUsers] = useState([]);
  const [shipmentMetrics, setShipmentMetrics] = useState({
    totalShipments: 0,
    pendingShipments: 0,
    completedShipments: 0,
    totalRevenue: 0,
  });
  const [userMetrics, setUserMetrics] = useState({
    totalUsers: 0,
    roleDistribution: {},
    newUsersPerDay: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Process user metrics
  const processUserMetrics = useCallback((usersData) => {
    if (!usersData.length) return;

    // Calculate role distribution
    const roleDistribution = usersData.reduce((acc, user) => {
      const role = user.role || 'customer';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    // Calculate new users per day (last 7 days)
    const newUsersPerDay = calculateNewUsersPerDay(usersData);

    setUserMetrics({
      totalUsers: usersData.length,
      roleDistribution,
      newUsersPerDay
    });
  }, []);

  // Function to fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch both data sources in parallel
      const [shipmentsResponse, usersResponse] = await Promise.all([
        getAdminShipments(),
        userService.getAllUsers({ limit: 9999 })
      ]);

      // Process shipments data
      const shipmentsData = shipmentsResponse.data.shipments || [];
      setShipments(shipmentsData);
      setShipmentMetrics(calculateShipmentMetrics(shipmentsData));

      // Process users data
      const usersData = usersResponse.data.users || [];
      setUsers(usersData);

      // Calculate user metrics
      processUserMetrics(usersData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [processUserMetrics]);

  // Calculate new users per day for the last 7 days
  const calculateNewUsersPerDay = (usersData) => {
    const today = new Date();
    const result = [];
    
    // Create an array of the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const count = usersData.filter(user => {
        if (!user.createdAt) return false;
        const createdDate = typeof user.createdAt === 'string' 
          ? parseISO(user.createdAt) 
          : new Date(user.createdAt);
        return format(createdDate, 'yyyy-MM-dd') === formattedDate;
      }).length;
      
      result.push({
        date: formattedDate,
        displayDate: format(date, 'MMM dd'),
        count
      });
    }
    
    return result;
  };

  // Fetch data on initial load
  useEffect(() => {
    fetchDashboardData();

    // Set up polling if refresh interval is provided
    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchDashboardData, refreshInterval);
      
      // Clear interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, fetchDashboardData]);

  return {
    loading,
    error,
    shipments,
    users,
    shipmentMetrics,
    userMetrics,
    refreshData: fetchDashboardData
  };
};

export default useDashboardData;
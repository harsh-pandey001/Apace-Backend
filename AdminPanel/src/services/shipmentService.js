import api from './api';

/**
 * Fetch all shipments for admin dashboard
 * @param {Object} params - Query parameters for pagination, filtering, etc.
 * @returns {Promise} - Promise resolving to shipment data
 */
export const getAdminShipments = async (params = {}) => {
  try {
    const response = await api.get('/shipments/admin', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching shipments:', error);
    throw error;
  }
};

/**
 * Calculate summary metrics from shipment data
 * @param {Array} shipments - Array of shipment objects
 * @returns {Object} - Object containing metrics
 */
export const calculateShipmentMetrics = (shipments) => {
  if (!shipments || !shipments.length) {
    return {
      totalShipments: 0,
      pendingShipments: 0,
      completedShipments: 0,
      totalRevenue: 0,
      topUser: null
    };
  }

  // Count shipments by status
  const pendingShipments = shipments.filter(s => s.status === 'pending').length;
  const completedShipments = shipments.filter(s => s.status === 'delivered').length;
  
  // Calculate total revenue
  const totalRevenue = shipments.reduce((sum, shipment) => {
    const price = parseFloat(shipment.price) || 0;
    return sum + price;
  }, 0).toFixed(2);

  // Find top user by shipment count
  const userCounts = {};
  shipments.forEach(shipment => {
    if (shipment.user && shipment.user.email) {
      const email = shipment.user.email;
      userCounts[email] = (userCounts[email] || 0) + 1;
    }
  });

  let topUser = null;
  let maxCount = 0;
  
  Object.entries(userCounts).forEach(([email, count]) => {
    if (count > maxCount) {
      maxCount = count;
      // Find the user details
      const userInfo = shipments.find(s => s.user && s.user.email === email).user;
      topUser = {
        name: `${userInfo.firstName} ${userInfo.lastName}`,
        email: userInfo.email,
        shipmentCount: count
      };
    }
  });

  return {
    totalShipments: shipments.length,
    pendingShipments,
    completedShipments,
    totalRevenue,
    topUser
  };
};

/**
 * Format dates to a human-readable format
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Not scheduled';
  
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
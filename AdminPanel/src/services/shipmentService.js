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
 * Fetch a specific shipment by ID for admin view
 * @param {string} shipmentId - The ID of the shipment to fetch
 * @returns {Promise} - Promise resolving to shipment data with user details
 */
export const getAdminShipmentDetails = async (shipmentId) => {
  try {
    const response = await api.get(`/shipments/admin/${shipmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching shipment details:', error);
    throw error;
  }
};

/**
 * Delete a shipment (admin only)
 * @param {string} shipmentId - The ID of the shipment to delete
 * @returns {Promise} - Promise resolving to the deletion result
 */
export const deleteAdminShipment = async (shipmentId) => {
  try {
    const response = await api.delete(`/shipments/admin/${shipmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting shipment:', error);
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
 * Get shipments created in the last 24 hours for badge count
 * @returns {Promise} - Promise with new shipments count
 */
export const getLast24HoursShipmentsCount = async () => {
  try {
    const response = await getAdminShipments({ limit: 9999 });
    const shipments = response.data?.shipments || [];
    
    // Get last 24 hours timestamp
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Count shipments created in last 24 hours
    const newShipmentsLast24h = shipments.filter(shipment => {
      const createdDate = new Date(shipment.createdAt);
      return createdDate >= last24Hours;
    }).length;
    
    return newShipmentsLast24h;
  } catch (error) {
    console.error('Error getting last 24h shipments count:', error);
    return 0;
  }
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
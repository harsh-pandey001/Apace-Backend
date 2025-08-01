import api from './api';

/**
 * Service for driver-related API calls
 */
export const driverService = {
  /**
   * Get all drivers with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (starts from 1)
   * @param {number} params.limit - Items per page
   * @returns {Promise} - Promise with driver data
   */
  getAllDrivers: async (params = {}) => {
    const { page = 1, limit = 10 } = params;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    try {
      const response = await api.get(`/drivers/all?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  },
  
  /**
   * Get a single driver by ID
   * @param {string} id - Driver ID
   * @returns {Promise} - Promise with driver data
   */
  getDriverById: async (id) => {
    try {
      const response = await api.get(`/drivers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching driver ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Update driver availability status
   * @param {string} id - Driver ID
   * @param {Object} data - Update data
   * @returns {Promise} - Promise with updated driver data
   */
  updateDriverAvailability: async (id, data) => {
    try {
      const response = await api.put(`/drivers/${id}/availability`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating driver availability ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get available drivers filtered by vehicle type
   * @param {string} vehicleType - Vehicle type filter
   * @returns {Promise} - Promise with available drivers data
   */
  getAvailableDrivers: async (vehicleType) => {
    try {
      const queryParams = new URLSearchParams();
      if (vehicleType) {
        queryParams.append('vehicleType', vehicleType);
      }
      
      const response = await api.get(`/drivers/available?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      throw error;
    }
  },
  
  /**
   * Get driver statistics
   * @returns {Promise} - Promise with driver stats
   */
  getDriverStats: async () => {
    try {
      // Fetch all drivers for client-side stats calculation
      const response = await api.get('/drivers/all?limit=9999');
      const { drivers } = response.data.data;
      
      // Calculate stats
      const totalDrivers = drivers.length;
      const activeDrivers = drivers.filter(driver => driver.isActive).length;
      const inactiveDrivers = totalDrivers - activeDrivers;
      const verifiedDrivers = drivers.filter(driver => driver.isVerified).length;
      const pendingDrivers = totalDrivers - verifiedDrivers;
      
      // Count drivers created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newDriversToday = drivers.filter(driver => {
        const createdDate = new Date(driver.createdAt);
        return createdDate >= today;
      }).length;
      
      return {
        totalDrivers,
        activeDrivers,
        inactiveDrivers,
        verifiedDrivers,
        pendingDrivers,
        newDriversToday
      };
    } catch (error) {
      console.error('Error getting driver stats:', error);
      // Return default stats if error
      return {
        totalDrivers: 0,
        activeDrivers: 0,
        inactiveDrivers: 0,
        verifiedDrivers: 0,
        pendingDrivers: 0,
        newDriversToday: 0
      };
    }
  },
  
  /**
   * Create a new driver
   * @param {Object} driverData - Driver data
   * @returns {Promise} - Promise with created driver data
   */
  createDriver: async (driverData) => {
    try {
      const response = await api.post('/drivers/signup', driverData);
      return response.data;
    } catch (error) {
      console.error('Error creating driver:', error);
      throw error;
    }
  },
  
  /**
   * Update driver profile
   * @param {string} id - Driver ID
   * @param {Object} driverData - Driver data to update
   * @returns {Promise} - Promise with updated driver data
   */
  updateDriver: async (id, driverData) => {
    try {
      const response = await api.patch(`/drivers/${id}`, driverData);
      return response.data;
    } catch (error) {
      console.error(`Error updating driver ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a driver
   * @param {string} id - Driver ID
   * @returns {Promise} - Promise with deletion status
   */
  deleteDriver: async (id) => {
    try {
      const response = await api.delete(`/drivers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting driver ${id}:`, error);
      throw error;
    }
  }
};

export default driverService;
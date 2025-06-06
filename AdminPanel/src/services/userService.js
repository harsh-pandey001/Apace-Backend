import api from './api';

/**
 * Service for user-related API calls
 */
export const userService = {
  /**
   * Get all users with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (starts from 1)
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Optional search term
   * @param {Object} params.filters - Optional filters
   * @returns {Promise} - Promise with user data
   */
  getAllUsers: async (params = {}) => {
    const { page = 1, limit = 10 } = params;
    
    // Build query parameters - only use pagination since backend doesn't support filtering
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    try {
      const response = await api.get(`/users?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  /**
   * Get a single user by ID
   * @param {string} id - User ID
   * @returns {Promise} - Promise with user data
   */
  getUserById: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise} - Promise with created user data
   */
  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },
  
  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise} - Promise with updated user data
   */
  updateUser: async (id, userData) => {
    try {
      const response = await api.patch(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a user (soft delete - deactivate)
   * @param {string} id - User ID
   * @returns {Promise} - Promise with deletion status
   */
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Permanently delete a user (hard delete)
   * @param {string} id - User ID
   * @returns {Promise} - Promise with deletion status
   */
  permanentDeleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}/permanent`);
      return response.data;
    } catch (error) {
      console.error(`Error permanently deleting user ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get user statistics
   * @returns {Promise} - Promise with user stats
   */
  getUserStats: async () => {
    try {
      // This is a placeholder. The API might not support this yet,
      // so we'll derive it from the user list
      const response = await api.get('/users?limit=9999');
      const { users } = response.data.data;
      
      // Calculate stats
      const totalUsers = users.length;
      const activeUsers = users.filter(user => user.active).length;
      const inactiveUsers = totalUsers - activeUsers;
      
      // Count users created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = users.filter(user => {
        const createdDate = new Date(user.createdAt);
        return createdDate >= today;
      }).length;
      
      // Count by role
      const roleDistribution = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsersToday,
        roleDistribution
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  },
  
  /**
   * Get users created in the last 24 hours for badge count
   * @returns {Promise} - Promise with new users count
   */
  getLast24HoursUsersCount: async () => {
    try {
      const response = await api.get('/users?limit=9999');
      const { users } = response.data.data;
      
      // Filter users excluding admins
      const nonAdminUsers = users.filter(user => user.role !== 'admin');
      
      // Get last 24 hours timestamp
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Count users created in last 24 hours
      const newUsersLast24h = nonAdminUsers.filter(user => {
        const createdDate = new Date(user.createdAt);
        return createdDate >= last24Hours;
      }).length;
      
      return newUsersLast24h;
    } catch (error) {
      console.error('Error getting last 24h users count:', error);
      return 0;
    }
  },

  /**
   * Get all drivers (users with role 'driver')
   * @returns {Promise} - Promise with driver data
   */
  getDrivers: async () => {
    try {
      const response = await api.get('/users?limit=9999');
      const { users } = response.data.data;
      
      // Filter only drivers
      const drivers = users.filter(user => user.role === 'driver' && user.active);
      
      return { data: { drivers } };
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  }
};

export default userService;
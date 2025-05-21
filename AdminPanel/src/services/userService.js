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
    const { page = 1, limit = 10, search = '', filters = {} } = params;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    if (search) {
      queryParams.append('search', search);
    }
    
    // Add any other filters
    if (filters.role) {
      queryParams.append('role', filters.role);
    }
    
    if (filters.active !== undefined) {
      queryParams.append('active', filters.active);
    }
    
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
   * Delete a user
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
  }
};

export default userService;
import api from './api';

/**
 * Service for authentication-related API calls
 */
const authService = {
  /**
   * Request OTP for login
   * @param {string} phone - Phone number
   * @returns {Promise} - Promise with OTP request response
   */
  requestOtp: async (phone) => {
    try {
      const response = await api.post('/auth/request-otp', { phone });
      return response.data;
    } catch (error) {
      console.error('Error requesting OTP:', error);
      throw error;
    }
  },

  /**
   * Verify OTP and login
   * @param {string} phone - Phone number
   * @param {string} otp - OTP code
   * @returns {Promise} - Promise with login response including tokens
   */
  verifyOtp: async (phone, otp) => {
    try {
      console.log('Verifying OTP with parameters:', { phone, otp });
      const response = await api.post('/auth/verify-otp', { phone, otp });
      console.log('OTP verification response:', response.data);
      
      // Store tokens in localStorage
      if (response.data.token) {
        console.log('Storing token in localStorage');
        localStorage.setItem('auth_token', response.data.token);
      } else {
        console.warn('No token in response');
      }
      
      if (response.data.refreshToken) {
        console.log('Storing refresh token in localStorage');
        localStorage.setItem('refresh_token', response.data.refreshToken);
      } else {
        console.warn('No refresh token in response');
      }
      
      // Store user data
      if (response.data.data && response.data.data.user) {
        console.log('Storing user data in localStorage:', response.data.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      } else {
        console.warn('No user data in response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  },

  /**
   * Get current user data from localStorage
   * @returns {Object|null} User data or null if not logged in
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  /**
   * Get user profile from API
   * @returns {Promise} - Promise with user profile
   */
  getUserProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      
      // Update stored user data
      if (response.data.data && response.data.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  /**
   * Refresh access token using refresh token
   * @returns {Promise} - Promise with new tokens
   */
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await api.post('/auth/refresh-token', { refreshToken });
      
      // Update tokens in localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      if (response.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error refreshing token:', error);
      
      // Clear auth data if refresh fails
      authService.clearAuthData();
      
      throw error;
    }
  },

  /**
   * Logout user
   * @returns {Promise} - Promise with logout status
   */
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      
      // Clear auth data
      authService.clearAuthData();
      
      return response.data;
    } catch (error) {
      console.error('Error logging out:', error);
      
      // Clear auth data even if API call fails
      authService.clearAuthData();
      
      throw error;
    }
  },

  /**
   * Clear all auth-related data from localStorage
   */
  clearAuthData: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },

  /**
   * Check if the current user is an admin
   * @returns {boolean} - True if user is an admin
   */
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'admin';
  }
};

export default authService;
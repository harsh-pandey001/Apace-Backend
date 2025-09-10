import axios from 'axios';

// Get API base URL from environment variables
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'https://apace-backend-dev-86500976134.us-central1.run.app/api';

// Debug logging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('API Configuration:');
  console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
  console.log('Final API Base URL:', apiBaseUrl);
}

// Create axios instance with base URL and default configs
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000, // Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Helps identify AJAX requests
  },
  // Enable credentials for production CORS
  withCredentials: process.env.NODE_ENV === 'production' ? true : false,
  
  // Additional axios configuration for better reliability
  validateStatus: function (status) {
    // Resolve promise for status codes less than 500
    return status < 500;
  }
});

// Request interceptor for adding the auth token to all requests
api.interceptors.request.use(
  (config) => {
    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Making API request to:', config.url);
      console.log('Full URL:', config.baseURL + config.url);
    }
    
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Request interceptor error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API response success:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API response error:', error.response?.status, error.config?.url);
      console.error('Error details:', error.message);
      
      // Log CORS-specific errors
      if (error.message.includes('CORS') || error.message.includes('Access-Control')) {
        console.error('CORS Error detected:', error.message);
        console.error('Request URL:', error.config?.url);
        console.error('Base URL:', error.config?.baseURL);
        console.error('Full URL:', `${error.config?.baseURL}${error.config?.url}`);
      }
      
      // Log network errors
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        console.error('Network error - possible CORS or connectivity issue');
        console.error('Check if backend is running at:', apiBaseUrl);
      }
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    
    // Handle CORS or network errors gracefully
    if (!error.response && (error.message.includes('CORS') || error.code === 'NETWORK_ERROR')) {
      const corsError = new Error(
        process.env.NODE_ENV === 'production' 
          ? 'Unable to connect to the server. Please check your internet connection and try again.'
          : 'Unable to connect to the server. This might be a CORS or network issue.'
      );
      corsError.isNetworkError = true;
      corsError.originalError = error;
      
      // In production, log the error details for debugging
      if (process.env.NODE_ENV === 'production') {
        console.error('Production API Error:', {
          message: error.message,
          code: error.code,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL
          }
        });
      }
      
      return Promise.reject(corsError);
    }
    
    return Promise.reject(error);
  }
);

// Export the axios instance
export default api;
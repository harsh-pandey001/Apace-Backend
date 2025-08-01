import axios from 'axios';

// Get API base URL from environment variables
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'https://apace-backend-l5ucytvnga-uc.a.run.app/api';

// Debug logging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('API Configuration:');
  console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
  console.log('Final API Base URL:', apiBaseUrl);
}

// Create axios instance with base URL and default configs
const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
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
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export the axios instance
export default api;
import axios from 'axios';

// Debug logging
console.log('API Configuration:');
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
const finalBaseURL = 'https://apace-backend-86500976134.us-central1.run.app/api'; // Hardcoded for testing
console.log('Final API Base URL:', finalBaseURL);

// Create axios instance with base URL and default configs
const api = axios.create({
  baseURL: finalBaseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for adding the auth token to all requests
api.interceptors.request.use(
  (config) => {
    console.log('Making API request to:', config.url);
    console.log('Full URL:', config.baseURL + config.url);
    
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    console.log('API response success:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API response error:', error.response?.status, error.config?.url);
    console.error('Error details:', error.message);
    
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
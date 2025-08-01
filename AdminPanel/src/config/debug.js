// Debug configuration
console.log('Environment Variables:');
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Test API URL construction
const baseURL = `${process.env.REACT_APP_API_BASE_URL || 'https://apace-backend-86500976134.us-central1.run.app'}/api`;
console.log('Final API URL:', baseURL);

export { baseURL };
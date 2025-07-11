const express = require('express');
const router = express.Router();
// Updated for no OTP driver signup
const { 
  driverSignup, 
  driverSignupNoOTP,
  getAllDrivers, 
  getDriverById, 
  updateDriverAvailability,
  getDriverProfile,
  updateDriverProfile,
  getAvailableDrivers
} = require('../controllers/driverSignup.controller');
const { 
  validateDriverSignup, 
  validateDriverSignupNoOTP,
  validateDriverAvailability,
  validateDriverProfileUpdate
} = require('../validations/driverSignup.validation');
const { protect } = require('../middleware/auth');
const { 
  driverProfileCacheMiddleware, 
  clearDriverCacheMiddleware,
  driverCacheMiddleware
} = require('../middleware/driverCache');

// Driver signup route (public) - without OTP verification
router.post('/signup', validateDriverSignupNoOTP, driverSignupNoOTP);

// Driver signup route with OTP verification (for compatibility)
router.post('/signup-with-otp', validateDriverSignup, driverSignup);

// Get all drivers (admin only) - must come before /:id route
router.get('/all', protect, getAllDrivers);

// Get available drivers filtered by vehicle type (admin only) - must come before /:id route
router.get('/available', protect, getAvailableDrivers);

// Get current driver profile (driver only) - must come before /:id route (with caching)
router.get('/profile', protect, driverProfileCacheMiddleware(300), getDriverProfile);

// Update current driver profile (driver only) - must come before /:id route (with cache invalidation)
router.patch('/profile', 
  protect, 
  validateDriverProfileUpdate, 
  clearDriverCacheMiddleware({ dataTypes: ['profile'] }),
  updateDriverProfile
);

// Update driver availability status (driver or admin) - must come before /:id route (with cache invalidation)
router.put('/:id/availability', 
  protect, 
  validateDriverAvailability, 
  clearDriverCacheMiddleware({ dataTypes: ['status', 'profile'] }),
  updateDriverAvailability
);

// Get driver by ID (admin only) - generic route must come last (with caching)
router.get('/:id', protect, driverCacheMiddleware('profile', 300), getDriverById);

module.exports = router;
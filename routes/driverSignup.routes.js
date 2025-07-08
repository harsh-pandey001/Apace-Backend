const express = require('express');
const router = express.Router();
const { 
  driverSignup, 
  getAllDrivers, 
  getDriverById, 
  updateDriverAvailability,
  getDriverProfile,
  updateDriverProfile
} = require('../controllers/driverSignup.controller');
const { 
  validateDriverSignup, 
  validateDriverAvailability,
  validateDriverProfileUpdate
} = require('../validations/driverSignup.validation');
const { protect } = require('../middleware/auth');

// Driver signup route (public)
router.post('/signup', validateDriverSignup, driverSignup);

// Get all drivers (admin only) - must come before /:id route
router.get('/all', protect, getAllDrivers);

// Get current driver profile (driver only) - must come before /:id route
router.get('/profile', protect, getDriverProfile);

// Update current driver profile (driver only) - must come before /:id route
router.patch('/profile', protect, validateDriverProfileUpdate, updateDriverProfile);

// Update driver availability status (driver or admin) - must come before /:id route
router.put('/:id/availability', protect, validateDriverAvailability, updateDriverAvailability);

// Get driver by ID (admin only) - generic route must come last
router.get('/:id', protect, getDriverById);

module.exports = router;
const express = require('express');
const driverStatusController = require('../controllers/driverStatus.controller');
const { protect } = require('../middleware/auth');
const { updateDriverStatusValidation } = require('../validations/driverStatus.validation');
const { 
  driverStatusCacheMiddleware, 
  clearDriverCacheMiddleware 
} = require('../middleware/driverCache');

const router = express.Router();

// Protect all routes - require authentication
router.use(protect);

// Get current driver status (with caching)
router.get('/status', driverStatusCacheMiddleware(300), driverStatusController.getDriverStatus);

// Update driver status (with cache invalidation)
router.post(
  '/status',
  updateDriverStatusValidation,
  clearDriverCacheMiddleware({ dataTypes: ['status'] }),
  driverStatusController.updateDriverStatus
);

module.exports = router;
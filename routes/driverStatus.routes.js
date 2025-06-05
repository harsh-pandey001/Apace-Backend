const express = require('express');
const driverStatusController = require('../controllers/driverStatus.controller');
const { protect } = require('../middleware/auth');
const { updateDriverStatusValidation } = require('../validations/driverStatus.validation');

const router = express.Router();

// Protect all routes - require authentication
router.use(protect);

// Get current driver status
router.get('/status', driverStatusController.getDriverStatus);

// Update driver status
router.post(
  '/status',
  updateDriverStatusValidation,
  driverStatusController.updateDriverStatus
);

module.exports = router;
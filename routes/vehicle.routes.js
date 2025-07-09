const express = require('express');
const vehicleController = require('../controllers/vehicle.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin only routes
router.use(restrictTo('admin'));

// Get available vehicles for assignment
router.get('/available', vehicleController.getAvailableVehicles);

// Get all vehicles
router.get('/', vehicleController.getAllVehicles);

// Create a new vehicle
router.post('/', [
  body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
  body('type').isIn(['car', 'van', 'truck', 'motorcycle']).withMessage('Invalid vehicle type'),
  body('model').notEmpty().withMessage('Vehicle model is required'),
  body('licensePlate').notEmpty().withMessage('License plate is required'),
  body('capacity').optional().isFloat({ min: 0 }).withMessage('Capacity must be a positive number'),
  body('maxWeight').optional().isFloat({ min: 0 }).withMessage('Max weight must be a positive number'),
  body('driverId').optional().isUUID().withMessage('Driver ID must be a valid UUID'),
  validate
], vehicleController.createVehicle);

// Update vehicle status
router.patch('/:id/status', [
  body('status').isIn(['available', 'in_use', 'maintenance', 'out_of_service']).withMessage('Invalid status'),
  body('driverId').optional().isUUID().withMessage('Driver ID must be a valid UUID'),
  validate
], vehicleController.updateVehicleStatus);

module.exports = router;
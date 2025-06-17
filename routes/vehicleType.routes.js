const express = require('express');
const vehicleTypeController = require('../controllers/vehicleType.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { 
  createVehicleTypeValidation, 
  updateVehicleTypeValidation, 
  getVehicleTypeValidation 
} = require('../validations/vehicleType.validation');

const router = express.Router();

// Public routes - anyone can view vehicle types and pricing
router.get('/', vehicleTypeController.getPublicVehicleTypes); // Optimized for frontend consumption
router.get('/:vehicleType/pricing', vehicleTypeController.getVehiclePricing);

// Protected routes - require authentication
router.use(protect);

// Admin routes that require authentication
router.get('/admin/all', vehicleTypeController.getAllVehicleTypes); // Full details for admin panel

// Admin only routes - require admin role
router.use(restrictTo('admin'));

// CRUD operations for vehicle types (admin only)
router.post('/', createVehicleTypeValidation, vehicleTypeController.createVehicleType);
router.get('/:vehicleId', getVehicleTypeValidation, vehicleTypeController.getVehicleTypeById);
router.put('/:vehicleId', updateVehicleTypeValidation, vehicleTypeController.updateVehicleType);
router.delete('/:vehicleId', getVehicleTypeValidation, vehicleTypeController.deleteVehicleType);

module.exports = router;
const express = require('express');
const vehicleTypeController = require('../controllers/vehicleType.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { 
  createVehicleTypeValidation, 
  updateVehicleTypeValidation, 
  getVehicleTypeValidation 
} = require('../validations/vehicleType.validation');
const { publicCacheMiddleware, clearCacheMiddleware, resourceCacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Public routes - anyone can view vehicle types and pricing (with caching)
router.get('/', publicCacheMiddleware('vehicles', 600), vehicleTypeController.getPublicVehicleTypes); // Optimized for frontend consumption
router.get('/:vehicleType/pricing', publicCacheMiddleware('vehicle-pricing', 600), vehicleTypeController.getVehiclePricing);

// Protected routes - require authentication
router.use(protect);

// Admin routes that require authentication (with caching)
router.get('/admin/all', resourceCacheMiddleware('admin-vehicles', 'admin', 300), vehicleTypeController.getAllVehicleTypes); // Full details for admin panel

// Admin only routes - require admin role
router.use(restrictTo('admin'));

// CRUD operations for vehicle types (admin only) - with cache invalidation
router.post('/', 
  createVehicleTypeValidation, 
  clearCacheMiddleware({
    customInvalidation: async () => {
      const cacheManager = require('../utils/cache');
      // Invalidate all vehicle-related public cache
      await cacheManager.invalidateCachePattern('public:vehicles:*');
      await cacheManager.invalidateCachePattern('public:vehicle-pricing:*');
      await cacheManager.invalidateCachePattern('admin-vehicles:*');
    }
  }),
  vehicleTypeController.createVehicleType
);
router.get('/:vehicleId', getVehicleTypeValidation, resourceCacheMiddleware('vehicle-type', 'vehicleId', 300), vehicleTypeController.getVehicleTypeById);
router.put('/:vehicleId', 
  updateVehicleTypeValidation, 
  clearCacheMiddleware({
    customInvalidation: async () => {
      const cacheManager = require('../utils/cache');
      // Invalidate all vehicle-related public cache
      await cacheManager.invalidateCachePattern('public:vehicles:*');
      await cacheManager.invalidateCachePattern('public:vehicle-pricing:*');
      await cacheManager.invalidateCachePattern('admin-vehicles:*');
      await cacheManager.invalidateCachePattern('vehicle-type:*');
    }
  }),
  vehicleTypeController.updateVehicleType
);
router.delete('/:vehicleId', 
  getVehicleTypeValidation, 
  clearCacheMiddleware({
    customInvalidation: async () => {
      const cacheManager = require('../utils/cache');
      // Invalidate all vehicle-related public cache
      await cacheManager.invalidateCachePattern('public:vehicles:*');
      await cacheManager.invalidateCachePattern('public:vehicle-pricing:*');
      await cacheManager.invalidateCachePattern('admin-vehicles:*');
      await cacheManager.invalidateCachePattern('vehicle-type:*');
    }
  }),
  vehicleTypeController.deleteVehicleType
);

// Get shipments using a specific vehicle type (admin only)
router.get('/:vehicleId/shipments', 
  getVehicleTypeValidation, 
  vehicleTypeController.getShipmentsUsingVehicleType
);

module.exports = router;
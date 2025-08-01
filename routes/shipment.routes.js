const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const shipmentController = require('../controllers/shipment.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { conditionalProtect } = require('../middleware/conditionalAuth');
const { mapGuestShipmentFields } = require('../middleware/fieldMapping');
const { createGuestShipmentValidation, createUnifiedShipmentValidation } = require('../validations/shipment.validation');
const { userCacheMiddleware, clearCacheMiddleware, resourceCacheMiddleware, publicCacheMiddleware } = require('../middleware/cache');
const { driverShipmentsCacheMiddleware, invalidateDriverShipmentsMiddleware } = require('../middleware/driverCache');

const router = express.Router();

// Rate limiter for guest endpoints
const guestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 guest bookings per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many guest bookings from this IP, please try again after 15 minutes'
  }
});

// Dynamic rate limiter for unified booking endpoint
const unifiedBookingLimiter = (req, res, next) => {
  // Apply guest rate limiting only for guest bookings
  if (req.body && req.body.userType === 'guest') {
    return guestLimiter(req, res, next);
  }
  // For authenticated users, no rate limiting (can be added later if needed)
  return next();
};

// Rate limiter for tracking
const trackingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 tracking requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many tracking requests from this IP, please try again after 5 minutes'
  }
});

// Public routes (no auth required)
// Track a shipment by tracking number (with caching)
router.get('/track/:trackingNumber', trackingLimiter, publicCacheMiddleware('tracking', 120), shipmentController.trackShipment);

// Guest booking routes (keep for backward compatibility)
router.post('/guest', guestLimiter, mapGuestShipmentFields, createGuestShipmentValidation, shipmentController.createGuestShipment);
router.get('/guest/:trackingNumber', trackingLimiter, publicCacheMiddleware('guest-tracking', 120), shipmentController.trackGuestShipment);

// Unified booking endpoint that handles both authenticated and guest users
router.post('/', 
  unifiedBookingLimiter, 
  mapGuestShipmentFields, 
  createUnifiedShipmentValidation, 
  conditionalProtect,
  clearCacheMiddleware({ 
    userDataTypes: ['shipments'],
    customInvalidation: async (req) => {
      // Only invalidate cache for authenticated users (guest users don't have shipment cache)
      if (req.body.userType === 'authenticated' && req.user?.id) {
        const cacheManager = require('../utils/cache');
        await cacheManager.invalidateUserCache(req.user.id, 'shipments');
      }
    }
  }),
  shipmentController.createShipment
);

// Protect all other routes
router.use(protect);

// Routes for regular users
// Get all shipments for current user (with caching)
router.get('/my-shipments', userCacheMiddleware('shipments', 180), shipmentController.getUserShipments);

// Get a specific shipment for current user (with caching)
router.get('/my-shipments/:id', resourceCacheMiddleware('shipment', 'id', 180), shipmentController.getUserShipment);

// Admin routes
router.get('/admin', restrictTo('admin'), shipmentController.getAllShipments);
router.get('/admin/:id', restrictTo('admin'), resourceCacheMiddleware('admin-shipment', 'id', 180), shipmentController.getShipment);
router.patch('/admin/:id', 
  restrictTo('admin'), 
  clearCacheMiddleware({ 
    resourceType: 'shipment',
    userDataTypes: ['shipments'],
    customInvalidation: async (req) => {
      // Invalidate tracking cache for this shipment
      const shipmentId = req.params.id;
      await require('../middleware/cache').invalidateResourceCache('tracking', shipmentId);
    }
  }),
  shipmentController.updateShipment
);
router.delete('/admin/:id', 
  restrictTo('admin'), 
  clearCacheMiddleware({ 
    resourceType: 'shipment',
    userDataTypes: ['shipments']
  }),
  shipmentController.deleteShipment
);
router.patch(
  '/admin/assign/:id',
  restrictTo('admin'),
  [
    body('driverId').isUUID().withMessage('Valid driver ID is required'),
    body('vehicleId').optional().isUUID().withMessage('Vehicle ID must be a valid UUID'),
    body('estimatedDeliveryDate').optional().isISO8601().withMessage('Estimated delivery date must be a valid date'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  clearCacheMiddleware({ 
    resourceType: 'shipment',
    userDataTypes: ['shipments'],
    customInvalidation: async (req) => {
      // Invalidate driver shipments cache when a shipment is assigned
      const driverId = req.body.driverId;
      if (driverId) {
        const driverCacheManager = require('../utils/driverCache');
        await driverCacheManager.invalidateDriverShipmentsCache(driverId);
      }
    }
  }),
  shipmentController.assignShipment
);

// Driver routes
router.get('/driver/assigned', 
  restrictTo('driver', 'admin'), 
  driverShipmentsCacheMiddleware(180), // 3 minutes cache for driver shipments
  shipmentController.getDriverShipments
);
router.patch(
  '/driver/update-status/:id',
  restrictTo('driver', 'admin'),
  [
    body('status')
      .isIn(['pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed'])
      .withMessage('Invalid status'),
    body('notes').optional().isString()
  ],
  clearCacheMiddleware({ 
    resourceType: 'shipment',
    userDataTypes: ['shipments'],
    customInvalidation: async (req) => {
      // Invalidate tracking cache for this shipment
      const shipmentId = req.params.id;
      await require('../middleware/cache').invalidateResourceCache('tracking', shipmentId);
    }
  }),
  invalidateDriverShipmentsMiddleware(), // Invalidate driver-specific shipments cache
  shipmentController.updateShipmentStatus
);

module.exports = router;
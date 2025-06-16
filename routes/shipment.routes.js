const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const shipmentController = require('../controllers/shipment.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { conditionalProtect } = require('../middleware/conditionalAuth');
const { mapGuestShipmentFields } = require('../middleware/fieldMapping');
const { createShipmentValidation, createGuestShipmentValidation, createUnifiedShipmentValidation } = require('../validations/shipment.validation');

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
// Track a shipment by tracking number
router.get('/track/:trackingNumber', trackingLimiter, shipmentController.trackShipment);

// Guest booking routes (keep for backward compatibility)
router.post('/guest', guestLimiter, mapGuestShipmentFields, createGuestShipmentValidation, shipmentController.createGuestShipment);
router.get('/guest/:trackingNumber', trackingLimiter, shipmentController.trackGuestShipment);

// Unified booking endpoint that handles both authenticated and guest users
router.post('/', unifiedBookingLimiter, mapGuestShipmentFields, createUnifiedShipmentValidation, conditionalProtect, shipmentController.createShipment);

// Protect all other routes
router.use(protect);

// Routes for regular users
// Get all shipments for current user
router.get('/my-shipments', shipmentController.getUserShipments);

// Get a specific shipment for current user
router.get('/my-shipments/:id', shipmentController.getUserShipment);

// Track a shipment by tracking number (no auth required)
router.get('/track/:trackingNumber', shipmentController.trackShipment);

// Driver routes
router.use('/driver', restrictTo('driver', 'admin'));

// Get all shipments assigned to driver
router.get('/driver/assigned', shipmentController.getDriverShipments);

// Update shipment status (for driver)
router.patch(
  '/driver/update-status/:id',
  [
    body('status')
      .isIn(['pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed'])
      .withMessage('Invalid status'),
    body('notes').optional().isString()
  ],
  shipmentController.updateShipmentStatus
);

// Admin routes
router.use('/admin', restrictTo('admin'));

// Get all shipments (admin)
router.get('/admin', shipmentController.getAllShipments);

// Get a specific shipment (admin)
router.get('/admin/:id', shipmentController.getShipment);

// Update a shipment (admin)
router.patch('/admin/:id', shipmentController.updateShipment);

// Delete a shipment (admin)
router.delete('/admin/:id', shipmentController.deleteShipment);

// Assign a shipment to a vehicle/driver (admin)
router.patch(
  '/admin/assign/:id',
  [
    body('vehicleId').isUUID().withMessage('Valid vehicle ID is required'),
    body('driverId').optional().isUUID().withMessage('Driver ID must be a valid UUID')
  ],
  shipmentController.assignShipment
);

module.exports = router;
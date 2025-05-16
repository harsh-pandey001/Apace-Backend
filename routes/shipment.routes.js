const express = require('express');
const { body } = require('express-validator');
const shipmentController = require('../controllers/shipment.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { createShipmentValidation } = require('../validations/shipment.validation');

const router = express.Router();

// Public routes (no auth required)
// Track a shipment by tracking number
router.get('/track/:trackingNumber', shipmentController.trackShipment);

// Protect all other routes
router.use(protect);

// Use shipment validation from validations file

// Routes for regular users
// Get all shipments for current user
router.get('/my-shipments', shipmentController.getUserShipments);

// Get a specific shipment for current user
router.get('/my-shipments/:id', shipmentController.getUserShipment);

// Create a new shipment
router.post('/', createShipmentValidation, shipmentController.createShipment);

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
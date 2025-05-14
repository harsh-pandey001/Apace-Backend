const express = require('express');
const { protect } = require('../middleware/auth');
const addressController = require('../controllers/address.controller');
const { 
  createAddressValidator, 
  updateAddressValidator, 
  addressIdValidator 
} = require('../validations/address.validation');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Protect all address routes - require authentication
router.use(protect);

// GET /api/addresses - Get all addresses for the logged-in user
router.get('/', addressController.getAllAddresses);

// POST /api/addresses - Create a new address
router.post('/', createAddressValidator, validate, addressController.createAddress);

// GET /api/addresses/:id - Get a specific address
router.get('/:id', addressIdValidator, validate, addressController.getAddress);

// PATCH /api/addresses/:id - Update an address
router.patch('/:id', updateAddressValidator, validate, addressController.updateAddress);

// DELETE /api/addresses/:id - Delete an address
router.delete('/:id', addressIdValidator, validate, addressController.deleteAddress);

// PATCH /api/addresses/:id/set-default - Set address as default
router.patch('/:id/set-default', addressIdValidator, validate, addressController.setDefaultAddress);

module.exports = router;
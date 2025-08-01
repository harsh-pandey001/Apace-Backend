const express = require('express');
const { protect } = require('../middleware/auth');
const addressController = require('../controllers/address.controller');
const { 
  createAddressValidator, 
  updateAddressValidator, 
  addressIdValidator 
} = require('../validations/address.validation');
const { validate } = require('../middleware/validate');
const { userCacheMiddleware, clearCacheMiddleware, resourceCacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Protect all address routes - require authentication
router.use(protect);

// GET /api/addresses - Get all addresses for the logged-in user (with caching)
router.get('/', userCacheMiddleware('addresses', 300), addressController.getAllAddresses);

// POST /api/addresses - Create a new address (with cache invalidation)
router.post('/', 
  createAddressValidator, 
  validate, 
  clearCacheMiddleware({ userDataTypes: ['addresses'] }),
  addressController.createAddress
);

// GET /api/addresses/:id - Get a specific address (with caching)
router.get('/:id', addressIdValidator, validate, resourceCacheMiddleware('address', 'id', 300), addressController.getAddress);

// PATCH /api/addresses/:id - Update an address (with cache invalidation)
router.patch('/:id', 
  updateAddressValidator, 
  validate, 
  clearCacheMiddleware({ 
    userDataTypes: ['addresses'],
    resourceType: 'address'
  }),
  addressController.updateAddress
);

// DELETE /api/addresses/:id - Delete an address (with cache invalidation)
router.delete('/:id', 
  addressIdValidator, 
  validate, 
  clearCacheMiddleware({ 
    userDataTypes: ['addresses'],
    resourceType: 'address'
  }),
  addressController.deleteAddress
);

// PATCH /api/addresses/:id/set-default - Set address as default (with cache invalidation)
router.patch('/:id/set-default', 
  addressIdValidator, 
  validate, 
  clearCacheMiddleware({ 
    userDataTypes: ['addresses'],
    resourceType: 'address'
  }),
  addressController.setDefaultAddress
);

module.exports = router;
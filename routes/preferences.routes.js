const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getUserPreferences, 
  updateUserPreferences 
} = require('../controllers/preferences.controller');
const { validateUpdatePreferences } = require('../validations/preferences.validation');
const { userCacheMiddleware, clearCacheMiddleware } = require('../middleware/cache');

// Apply protect middleware to all routes
router.use(protect);

// Get user preferences (with caching)
router.get('/', userCacheMiddleware('preferences', 600), getUserPreferences);

// Update user preferences (with cache invalidation)
router.put('/', 
  validateUpdatePreferences, 
  clearCacheMiddleware({ userDataTypes: ['preferences'] }),
  updateUserPreferences
);

module.exports = router;
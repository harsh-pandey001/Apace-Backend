const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getUserPreferences, 
  updateUserPreferences 
} = require('../controllers/preferences.controller');
const { validateUpdatePreferences } = require('../validations/preferences.validation');

// Apply protect middleware to all routes
router.use(protect);

// Get user preferences
router.get('/', getUserPreferences);

// Update user preferences
router.put('/', validateUpdatePreferences, updateUserPreferences);

module.exports = router;
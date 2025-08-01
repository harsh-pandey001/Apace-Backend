const express = require('express');
const router = express.Router();
const { 
  requestDriverOtp, 
  verifyDriverOtp, 
  refreshDriverToken, 
  logoutDriver 
} = require('../controllers/driverAuth.controller');
const { 
  requestDriverOtpValidation, 
  verifyDriverOtpValidation, 
  refreshDriverTokenValidation 
} = require('../validations/driverAuth.validation');
const { protect } = require('../middleware/auth');

// Driver authentication routes
router.post('/request-otp', requestDriverOtpValidation, requestDriverOtp);
router.post('/verify-otp', verifyDriverOtpValidation, verifyDriverOtp);
router.post('/refresh-token', refreshDriverTokenValidation, refreshDriverToken);
router.post('/logout', protect, logoutDriver);

module.exports = router;
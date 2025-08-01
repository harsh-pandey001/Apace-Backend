const express = require('express');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { 
  requestOtpValidation, 
  verifyOtpValidation, 
  signupValidation 
} = require('../validations/auth.validation');

const router = express.Router();

// OTP-based Authentication Routes
router.post('/request-otp', requestOtpValidation, authController.requestOtp);
router.post('/verify-otp', verifyOtpValidation, authController.verifyOtp);
router.post('/signup', signupValidation, authController.signup);

// Token management
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);

module.exports = router;
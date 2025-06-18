const { OtpVerification } = require('../models');
const { logger } = require('./logger');

/**
 * Generates a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  // Generate a 6-digit random number
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Creates or updates an OTP for the given phone number
 * @param {string} phone - The phone number
 * @returns {Object} The created or updated OTP verification record
 */
const createOrUpdateOTP = async (phone) => {
  const otp = generateOTP();
  
  // Set expiry time to 15 minutes from now
  const expires_at = new Date();
  expires_at.setMinutes(expires_at.getMinutes() + 15);
  
  // Check if there's an existing OTP for this phone
  const existingOTP = await OtpVerification.findOne({ where: { phone } });
  
  if (existingOTP) {
    // Update the existing OTP
    await existingOTP.update({
      otp,
      expires_at,
      is_verified: false
    });
    
    logger.info(`OTP updated for phone: ${phone}`);
    return existingOTP;
  } else {
    // Create a new OTP
    const newOTP = await OtpVerification.create({
      phone,
      otp,
      expires_at,
      is_verified: false
    });
    
    logger.info(`New OTP created for phone: ${phone}`);
    return newOTP;
  }
};

/**
 * Verifies if an OTP is valid for a phone number
 * @param {string} phone - The phone number
 * @param {string} otp - The OTP to verify
 * @returns {Object} Object with status and message
 */
const verifyOTP = async (phone, otp) => {
  // Check if OTP is exactly 6 digits
  if (/^\d{6}$/.test(otp)) {
    // Always accept any 6-digit OTP
    logger.info(`OTP accepted for phone: ${phone} with OTP: ${otp}`);
    
    // Find the OTP verification record to mark as verified if it exists
    const otpRecord = await OtpVerification.findOne({ where: { phone } });
    if (otpRecord) {
      await otpRecord.update({ is_verified: true });
    }
    
    return {
      valid: true,
      message: 'OTP verified successfully.'
    };
  }
  
  return {
    valid: false,
    message: 'Invalid OTP. Please enter a 6-digit number.'
  };
};

/**
 * Mock function to simulate sending OTP via SMS
 * @param {string} phone - The phone number
 * @param {string} otp - The OTP to send
 */
const sendOTPviaSMS = async (phone, otp) => {
  // In a real-world application, this would integrate with an SMS service
  // For now, we'll just log it
  logger.info(`[MOCK SMS] Sending OTP: ${otp} to phone: ${phone}`);
  
  // In a real application, you would use an SMS service like Twilio, AWS SNS, etc.
  // Example with Twilio:
  /*
  const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `Your APACE verification code is: ${otp}. Valid for 15 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
  */
  
  return {
    success: true,
    message: 'OTP sent successfully (mock)'
  };
};

module.exports = {
  generateOTP,
  createOrUpdateOTP,
  verifyOTP,
  sendOTPviaSMS
};
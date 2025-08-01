#!/usr/bin/env node

/**
 * Check Production Environment Variables
 * Run this in production to verify the actual values being used
 */

require('dotenv').config();

console.log('🔍 PRODUCTION ENVIRONMENT CHECK\n');

console.log('📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN, '(type:', typeof process.env.JWT_EXPIRES_IN, ')');
console.log('REFRESH_TOKEN_EXPIRES_IN:', process.env.REFRESH_TOKEN_EXPIRES_IN, '(type:', typeof process.env.REFRESH_TOKEN_EXPIRES_IN, ')');
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 'NOT SET');
console.log('JWT_REFRESH_SECRET length:', process.env.JWT_REFRESH_SECRET?.length || 'NOT SET');

console.log('\n🧪 Test Token Generation:');
const jwt = require('jsonwebtoken');

try {
  const token = jwt.sign({ test: true }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
  
  const decoded = jwt.decode(token);
  const expInSeconds = decoded.exp - decoded.iat;
  const expInHours = expInSeconds / 3600;
  
  console.log('✅ Token generated successfully');
  console.log('  Expected: 24 hours');
  console.log('  Actual:', expInHours, 'hours');
  console.log('  Actual:', expInSeconds, 'seconds');
  
  if (expInHours < 1) {
    console.log('❌ ERROR: Token expires too quickly! Environment variable is being interpreted as milliseconds.');
    console.log('💡 FIX: Change JWT_EXPIRES_IN from', process.env.JWT_EXPIRES_IN, 'to "24h"');
  } else if (expInHours >= 23 && expInHours <= 25) {
    console.log('✅ SUCCESS: Token expiry is correct (24 hours)');
  } else {
    console.log('⚠️  WARNING: Token expiry is unexpected');
  }
  
} catch (error) {
  console.log('❌ Token generation failed:', error.message);
}

console.log('\n🏁 Check completed');
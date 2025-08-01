// Minimal startup test
console.log('=== Testing Node.js startup ===');
console.log('Node version:', process.version);
console.log('Working directory:', process.cwd());
console.log('Environment NODE_ENV:', process.env.NODE_ENV);

try {
  console.log('1. Testing basic requires...');
  require('dotenv').config();
  console.log('✓ dotenv loaded');
  
  const express = require('express');
  console.log('✓ express loaded');
  
  console.log('2. Testing database config...');
  try {
    const { sequelize } = require('./config/database');
    console.log('✓ database config loaded');
  } catch (dbError) {
    console.log('⚠️  Database config error (expected in build):', dbError.message);
  }
  
  console.log('3. Testing models (basic require only)...');
  try {
    // Don't actually initialize models, just test if files exist
    require('fs').statSync('./models/index.js');
    console.log('✓ models directory exists');
  } catch (modelError) {
    console.log('❌ Models error:', modelError.message);
    throw modelError;
  }
  
  console.log('4. Testing notification services (basic require only)...');
  try {
    require('fs').statSync('./services/fcmService.js');
    require('fs').statSync('./services/notificationService.js');
    console.log('✓ notification service files exist');
  } catch (serviceError) {
    console.log('❌ Service files error:', serviceError.message);
    throw serviceError;
  }
  
  console.log('5. Creating express app...');
  const app = express();
  console.log('✓ app created');
  
  const PORT = process.env.PORT || 5000;
  console.log('✓ PORT:', PORT);
  
  console.log('=== BUILD VALIDATION PASSED ===');
  process.exit(0);
  
} catch (error) {
  console.error('❌ BUILD ERROR:', error.message);
  console.error('Stack:', error.stack);
  console.error('Files in current directory:');
  try {
    const fs = require('fs');
    console.error(fs.readdirSync('.').slice(0, 20));
  } catch (e) {}
  process.exit(1);
}
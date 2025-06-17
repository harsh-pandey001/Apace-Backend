#!/usr/bin/env node
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/shipments';

console.log('🧪 Testing Weight/EstimatedWeight Validation Fixes');
console.log('=============================================\n');

// Test 1: Guest booking with estimatedWeight (should work now)
async function testEstimatedWeight() {
  try {
    console.log('Test 1: Guest booking with estimatedWeight field');
    
    const guestBookingData = {
      userType: 'guest',
      pickupAddress: '123 Main Street, New York, NY 10001',
      deliveryAddress: '456 Oak Avenue, Brooklyn, NY 11201',
      estimatedWeight: 2.5, // Using estimatedWeight instead of weight
      vehicleType: 'bike',
      guestName: 'John Doe',
      guestPhone: '+1234567890',
      guestEmail: 'john.doe@example.com'
    };

    const response = await axios.post(BASE_URL, guestBookingData);
    
    console.log('✅ SUCCESS: estimatedWeight accepted');
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ FAILED: estimatedWeight not accepted');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
  console.log('\n');
}

// Test 2: Guest booking with weight field (should still work)
async function testWeightField() {
  try {
    console.log('Test 2: Guest booking with weight field');
    
    const guestBookingData = {
      userType: 'guest',
      pickupAddress: '123 Main Street, New York, NY 10001',
      deliveryAddress: '456 Oak Avenue, Brooklyn, NY 11201',
      weight: 3.0, // Using weight field
      vehicleType: 'van',
      guestName: 'Jane Smith',
      guestPhone: '+1987654321',
      guestEmail: 'jane.smith@example.com'
    };

    const response = await axios.post(BASE_URL, guestBookingData);
    
    console.log('✅ SUCCESS: weight field still works');
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ FAILED: weight field broken');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
  console.log('\n');
}

// Test 3: Legacy guest endpoint with estimatedWeight
async function testLegacyEstimatedWeight() {
  try {
    console.log('Test 3: Legacy guest endpoint with estimatedWeight');
    
    const legacyGuestData = {
      pickupAddress: '789 Business St, New York, NY 10001',
      deliveryAddress: '321 Corporate Ave, Brooklyn, NY 11201',
      estimatedWeight: 4.5, // Using estimatedWeight on legacy endpoint
      vehicleType: 'truck',
      guestName: 'Bob Wilson',
      guestPhone: '+1555666777',
      guestEmail: 'bob.wilson@example.com'
    };

    const response = await axios.post(`${BASE_URL}/guest`, legacyGuestData);
    
    console.log('✅ SUCCESS: Legacy endpoint accepts estimatedWeight');
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ FAILED: Legacy endpoint rejects estimatedWeight');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
  console.log('\n');
}

// Test 4: Invalid weight validation (should fail)
async function testInvalidWeight() {
  try {
    console.log('Test 4: Invalid weight validation');
    
    const invalidData = {
      userType: 'guest',
      pickupAddress: '123 Main Street, New York, NY 10001',
      deliveryAddress: '456 Oak Avenue, Brooklyn, NY 11201',
      estimatedWeight: -1, // Invalid negative weight
      vehicleType: 'bike',
      guestName: 'Test User',
      guestPhone: '+1234567890',
      guestEmail: 'test@example.com'
    };

    const response = await axios.post(BASE_URL, invalidData);
    console.log('⚠️ UNEXPECTED: Invalid weight was accepted');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ SUCCESS: Invalid weight properly rejected');
      console.log('Validation errors:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ FAILED: Unexpected error');
      console.error('Error:', error.message);
    }
  }
  console.log('\n');
}

// Test 5: Missing weight fields (should fail)
async function testMissingWeight() {
  try {
    console.log('Test 5: Missing weight fields');
    
    const noWeightData = {
      userType: 'guest',
      pickupAddress: '123 Main Street, New York, NY 10001',
      deliveryAddress: '456 Oak Avenue, Brooklyn, NY 11201',
      // No weight or estimatedWeight field
      vehicleType: 'bike',
      guestName: 'Test User',
      guestPhone: '+1234567890',
      guestEmail: 'test@example.com'
    };

    const response = await axios.post(BASE_URL, noWeightData);
    console.log('⚠️ UNEXPECTED: Missing weight was accepted');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ SUCCESS: Missing weight properly rejected');
      console.log('Validation errors:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ FAILED: Unexpected error');
      console.error('Error:', error.message);
    }
  }
  console.log('\n');
}

// Check server health
async function checkServer() {
  try {
    await axios.get('http://localhost:5000/health');
    console.log('✅ Server is running\n');
    return true;
  } catch (error) {
    console.error('❌ Server is not running');
    console.error('Please start with: npm start\n');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const serverRunning = await checkServer();
  if (!serverRunning) return;
  
  await testEstimatedWeight();
  await testWeightField();
  await testLegacyEstimatedWeight();
  await testInvalidWeight();
  await testMissingWeight();
  
  console.log('🎉 Weight validation tests completed!');
}

runAllTests().catch(console.error);
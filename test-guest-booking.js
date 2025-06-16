#!/usr/bin/env node
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/shipments';

// Test guest booking creation
async function testGuestBooking() {
  try {
    console.log('🚀 Testing guest shipment booking...\n');
    
    const guestBookingData = {
      pickupAddress: '123 Main Street, New York, NY 10001',
      deliveryAddress: '456 Oak Avenue, Brooklyn, NY 11201',
      weight: 2.5,
      vehicleType: 'bike',
      guestName: 'John Doe',
      guestPhone: '+1234567890',
      guestEmail: 'john.doe@example.com',
      specialInstructions: 'Please handle with care - fragile items'
    };

    console.log('Payload:', JSON.stringify(guestBookingData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/guest`, guestBookingData);
    
    console.log('✅ Guest booking created successfully!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    // Extract tracking number for testing tracking
    const trackingNumber = response.data.data.trackingNumber;
    
    // Test tracking the guest shipment
    console.log('\n🔍 Testing guest shipment tracking...\n');
    const trackingResponse = await axios.get(`${BASE_URL}/guest/${trackingNumber}`);
    
    console.log('✅ Guest shipment tracking successful!');
    console.log('Tracking response status:', trackingResponse.status);
    console.log('Tracking data:', JSON.stringify(trackingResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test with invalid data
async function testInvalidData() {
  try {
    console.log('\n🧪 Testing validation with invalid data...\n');
    
    const invalidData = {
      pickupAddress: '',  // Invalid - empty
      deliveryAddress: '456 Oak Avenue, Brooklyn, NY 11201',
      weight: -1,  // Invalid - negative
      vehicleType: 'invalid_type',  // Invalid vehicle type
      guestName: 'A',  // Invalid - too short
      guestPhone: 'invalid_phone',  // Invalid phone
      guestEmail: 'invalid_email'  // Invalid email
    };

    const response = await axios.post(`${BASE_URL}/guest`, invalidData);
    console.log('⚠️ Unexpected success with invalid data:', response.data);
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Validation working correctly!');
      console.log('Validation errors:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

// Test tracking non-existent shipment
async function testInvalidTracking() {
  try {
    console.log('\n🔍 Testing tracking non-existent shipment...\n');
    
    const response = await axios.get(`${BASE_URL}/guest/INVALID-TRACKING-NUMBER`);
    console.log('⚠️ Unexpected success for invalid tracking:', response.data);
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ Invalid tracking handling working correctly!');
      console.log('Error response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

// Run all tests
async function runTests() {
  await testGuestBooking();
  await testInvalidData();
  await testInvalidTracking();
  console.log('\n🎉 All tests completed!');
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get('http://localhost:5001/health');
    console.log('✅ Server is running on port 5001\n');
    return true;
  } catch (error) {
    console.error('❌ Server is not running on port 5001');
    console.error('Please start the server with: PORT=5001 npm start');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

main().catch(console.error);
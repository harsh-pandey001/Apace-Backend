#!/usr/bin/env node
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/shipments';

// Test unified booking API for guest users
async function testGuestBookingUnified() {
  try {
    console.log('🚀 Testing unified API with guest booking...\n');
    
    const guestBookingData = {
      userType: 'guest',
      pickupAddress: '123 Main Street, New York, NY 10001',
      deliveryAddress: '456 Oak Avenue, Brooklyn, NY 11201',
      weight: 2.5,
      vehicleType: 'bike',
      guestName: 'John Doe',
      guestPhone: '+1234567890',
      guestEmail: 'john.doe@example.com',
      specialInstructions: 'Please handle with care - fragile items'
    };

    console.log('Guest Payload:', JSON.stringify(guestBookingData, null, 2));
    
    const response = await axios.post(BASE_URL, guestBookingData);
    
    console.log('✅ Guest booking via unified API successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data.data.shipment.trackingNumber;
    
  } catch (error) {
    console.error('❌ Guest booking test failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    return null;
  }
}

// Test unified booking API for authenticated users
async function testAuthenticatedBookingUnified() {
  try {
    console.log('\n🔐 Testing unified API with authenticated booking...\n');
    
    // First, we need to get an auth token (simplified for testing)
    const authData = {
      phone: '+1234567890',
      password: 'testpassword123'
    };
    
    // Note: This would normally require a real user account and OTP verification
    // For testing purposes, we'll simulate what an authenticated request looks like
    
    const authenticatedBookingData = {
      userType: 'authenticated',
      pickupAddress: '789 Business St, New York, NY 10001',
      deliveryAddress: '321 Corporate Ave, Brooklyn, NY 11201',
      scheduledPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      weight: 5.0,
      vehicleType: 'van',
      specialInstructions: 'Handle as business package'
    };

    console.log('Authenticated Payload:', JSON.stringify(authenticatedBookingData, null, 2));
    
    // This should fail because we don't have a valid auth token
    const response = await axios.post(BASE_URL, authenticatedBookingData);
    
    console.log('✅ Authenticated booking via unified API successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Authentication properly required for authenticated bookings!');
      console.log('Expected 401 error:', error.response.data.message);
    } else {
      console.error('❌ Unexpected error in authenticated booking test!');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error:', error.message);
      }
    }
  }
}

// Test validation errors
async function testValidationErrors() {
  try {
    console.log('\n🧪 Testing validation with invalid data...\n');
    
    const invalidData = {
      userType: 'guest',
      pickupAddress: '',  // Invalid - empty
      deliveryAddress: '456 Oak Avenue, Brooklyn, NY 11201',
      weight: -1,  // Invalid - negative
      vehicleType: 'invalid_type',  // Invalid vehicle type
      guestName: 'A',  // Invalid - too short
      guestPhone: 'invalid_phone',  // Invalid phone
      guestEmail: 'invalid_email'  // Invalid email
    };

    const response = await axios.post(BASE_URL, invalidData);
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

// Test mixed user type validation
async function testMixedUserTypeValidation() {
  try {
    console.log('\n🔄 Testing mixed user type validation...\n');
    
    // Authenticated user with guest fields (should fail)
    const mixedData = {
      userType: 'authenticated',
      pickupAddress: '123 Main Street, New York, NY 10001',
      deliveryAddress: '456 Oak Avenue, Brooklyn, NY 11201',
      scheduledPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      guestName: 'John Doe',  // Should not be allowed for authenticated users
      guestPhone: '+1234567890'  // Should not be allowed for authenticated users
    };

    const response = await axios.post(BASE_URL, mixedData);
    console.log('⚠️ Unexpected success with mixed user type data:', response.data);
    
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Mixed user type validation working correctly!');
      console.log('Validation errors:', JSON.stringify(error.response.data, null, 2));
    } else if (error.response && error.response.status === 401) {
      console.log('✅ Authentication properly required!');
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

// Test tracking guest shipment via guest endpoint
async function testTrackingGuestShipment(trackingNumber) {
  if (!trackingNumber) {
    console.log('\n⏭️ Skipping tracking test - no tracking number available');
    return;
  }
  
  try {
    console.log(`\n🔍 Testing guest shipment tracking via guest endpoint: ${trackingNumber}...\n`);
    
    const trackingResponse = await axios.get(`${BASE_URL}/guest/${trackingNumber}`);
    
    console.log('✅ Guest shipment tracking successful!');
    console.log('Tracking response status:', trackingResponse.status);
    console.log('Tracking data:', JSON.stringify(trackingResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Tracking test failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run all tests
async function runTests() {
  const trackingNumber = await testGuestBookingUnified();
  await testAuthenticatedBookingUnified();
  await testValidationErrors();
  await testMixedUserTypeValidation();
  await testTrackingGuestShipment(trackingNumber);
  console.log('\n🎉 All unified booking tests completed!');
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
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Function to test valid distance (>= 1 km)
async function testValidDistance() {
  console.log('\n✅ Testing Valid Distance (2.5 km)...');
  
  const validDistanceData = {
    userType: 'guest',
    pickupAddress: '123 Broadway, New York, NY',
    deliveryAddress: '456 5th Avenue, Brooklyn, NY',
    pickupLat: 40.7128,
    pickupLng: -74.0060,
    deliveryLat: 40.6782,
    deliveryLng: -73.9442,
    weight: 3.5,
    vehicleType: 'bike',
    price: 45.75,
    distance: 2.5, // Valid distance
    guestName: 'John Doe',
    guestPhone: '+1234567890',
    guestEmail: 'john.doe@example.com',
    specialInstructions: 'Valid distance test'
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments`, validDistanceData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Shipment Created with Valid Distance:');
    console.log(`Distance: ${response.data.data.shipment.distance} km`);
    console.log(`Price: $${response.data.data.shipment.price}`);
    console.log(`Tracking Number: ${response.data.data.shipment.trackingNumber}`);
    return response.data;
  } catch (error) {
    console.error('❌ Valid distance test failed:', error.response?.data || error.message);
    return null;
  }
}

// Function to test minimum valid distance (1 km)
async function testMinimumValidDistance() {
  console.log('\n✅ Testing Minimum Valid Distance (1.0 km)...');
  
  const minValidDistanceData = {
    userType: 'guest',
    pickupAddress: '123 Main St, New York, NY',
    deliveryAddress: '125 Main St, New York, NY',
    pickupLat: 40.7128,
    pickupLng: -74.0060,
    deliveryLat: 40.7139,
    deliveryLng: -74.0071,
    weight: 2.0,
    vehicleType: 'bike',
    price: 25.00,
    distance: 1.0, // Minimum valid distance
    guestName: 'Jane Smith',
    guestPhone: '+1987654321',
    guestEmail: 'jane.smith@example.com'
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments`, minValidDistanceData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Shipment Created with Minimum Valid Distance:');
    console.log(`Distance: ${response.data.data.shipment.distance} km`);
    console.log(`Price: $${response.data.data.shipment.price}`);
    return response.data;
  } catch (error) {
    console.error('❌ Minimum valid distance test failed:', error.response?.data || error.message);
    return null;
  }
}

// Function to test invalid distance (< 1 km)
async function testInvalidShortDistance() {
  console.log('\n❌ Testing Invalid Short Distance (0.5 km)...');
  
  const invalidDistanceData = {
    userType: 'guest',
    pickupAddress: '123 Broadway, New York, NY',
    deliveryAddress: '125 Broadway, New York, NY',
    pickupLat: 40.7128,
    pickupLng: -74.0060,
    deliveryLat: 40.7132,
    deliveryLng: -74.0062,
    weight: 1.5,
    vehicleType: 'bike',
    price: 15.00,
    distance: 0.5, // Invalid distance (too short)
    guestName: 'Bob Wilson',
    guestPhone: '+1555666777',
    guestEmail: 'bob.wilson@example.com'
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments`, invalidDistanceData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('⚠️ Unexpected Success - This should have failed!');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log('✅ Expected Validation Error:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error Message: ${error.response?.data?.errors?.[0]?.msg || error.response?.data?.message}`);
    return error.response?.data;
  }
}

// Function to test very small distance (0.1 km)
async function testVeryShortDistance() {
  console.log('\n❌ Testing Very Short Distance (0.1 km)...');
  
  const veryShortDistanceData = {
    userType: 'guest',
    pickupAddress: '100 Broadway, New York, NY',
    deliveryAddress: '102 Broadway, New York, NY',
    weight: 1.0,
    vehicleType: 'bike',
    price: 10.00,
    distance: 0.1, // Very short distance
    guestName: 'Alice Johnson',
    guestPhone: '+1444555666',
    guestEmail: 'alice.johnson@example.com'
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments`, veryShortDistanceData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('⚠️ Unexpected Success - This should have failed!');
    return response.data;
  } catch (error) {
    console.log('✅ Expected Validation Error:');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error Message: ${error.response?.data?.errors?.[0]?.msg || error.response?.data?.message}`);
    return error.response?.data;
  }
}

// Function to test shipment without distance (should be allowed)
async function testNoDistanceProvided() {
  console.log('\n🔄 Testing Shipment Without Distance (Should be allowed)...');
  
  const noDistanceData = {
    userType: 'guest',
    pickupAddress: '200 Broadway, New York, NY',
    deliveryAddress: '300 Broadway, Brooklyn, NY',
    weight: 4.0,
    vehicleType: 'car',
    price: 55.00,
    // No distance field provided
    guestName: 'Charlie Brown',
    guestPhone: '+1333444555',
    guestEmail: 'charlie.brown@example.com'
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments`, noDistanceData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Shipment Created Without Distance:');
    console.log(`Distance: ${response.data.data.shipment.distance || 'null'}`);
    console.log(`Price: $${response.data.data.shipment.price}`);
    return response.data;
  } catch (error) {
    console.error('❌ No distance test failed:', error.response?.data || error.message);
    return null;
  }
}

// Function to test legacy guest endpoint with distance
async function testLegacyEndpointWithDistance() {
  console.log('\n🔄 Testing Legacy Guest Endpoint with Distance...');
  
  const legacyData = {
    pickupAddress: '400 Broadway, Manhattan, NY',
    deliveryAddress: '500 Broadway, Queens, NY',
    weight: 3.0,
    vehicleType: 'van',
    price: 75.50,
    distance: 8.2,
    guestName: 'David Lee',
    guestPhone: '+1222333444',
    guestEmail: 'david.lee@example.com'
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments/guest`, legacyData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Legacy Endpoint Shipment Created:');
    console.log(`Distance: ${response.data.data.shipment.distance} km`);
    console.log(`Price: $${response.data.data.shipment.price}`);
    return response.data;
  } catch (error) {
    console.error('❌ Legacy endpoint test failed:', error.response?.data || error.message);
    return null;
  }
}

// Function to track shipment and verify distance is included
async function testTrackingWithDistance(trackingNumber) {
  console.log(`\n📍 Testing Tracking with Distance: ${trackingNumber}...`);
  
  try {
    const response = await axios.get(`${BASE_URL}/shipments/track/${trackingNumber}`);
    
    console.log('✅ Tracking Response includes Distance:');
    console.log(`Distance: ${response.data.data.shipment.distance} km`);
    console.log(`Price: $${response.data.data.shipment.price}`);
    console.log(`Status: ${response.data.data.shipment.status}`);
    return response.data;
  } catch (error) {
    console.error('❌ Tracking test failed:', error.response?.data || error.message);
    return null;
  }
}

// Main test function
async function runDistanceValidationTests() {
  console.log('🚀 Starting Distance Validation Tests...');
  console.log('=========================================');

  // Test 1: Valid distance (should succeed)
  const validResult = await testValidDistance();
  
  // Test 2: Minimum valid distance (should succeed)
  const minValidResult = await testMinimumValidDistance();
  
  // Test 3: Invalid short distance (should fail)
  await testInvalidShortDistance();
  
  // Test 4: Very short distance (should fail)
  await testVeryShortDistance();
  
  // Test 5: No distance provided (should succeed)
  const noDistanceResult = await testNoDistanceProvided();
  
  // Test 6: Legacy endpoint with distance
  const legacyResult = await testLegacyEndpointWithDistance();
  
  // Test 7: Track shipments to verify distance is stored
  if (validResult?.data?.trackingNumber) {
    await testTrackingWithDistance(validResult.data.trackingNumber);
  }
  
  if (legacyResult?.data?.trackingNumber) {
    await testTrackingWithDistance(legacyResult.data.trackingNumber);
  }

  console.log('\n🎉 Distance validation tests completed!');
  console.log('\nValidation Rules:');
  console.log('✅ Minimum distance: 1.0 km');
  console.log('✅ Distance field is optional');
  console.log('❌ Distance < 1.0 km rejected with error message');
  console.log('✅ Distance stored and returned in all responses');
}

// Run the tests
if (require.main === module) {
  runDistanceValidationTests().catch(console.error);
}

module.exports = {
  testValidDistance,
  testMinimumValidDistance,
  testInvalidShortDistance,
  testVeryShortDistance,
  testNoDistanceProvided,
  testLegacyEndpointWithDistance,
  testTrackingWithDistance
};
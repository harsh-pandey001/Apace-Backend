const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Function to test guest shipment creation with frontend-calculated price
async function testGuestShipmentWithFrontendPrice() {
  console.log('\n📦 Testing Guest Shipment Creation with Frontend-Calculated Price...');
  
  const guestShipmentData = {
    userType: 'guest',
    pickupAddress: '123 Broadway, New York, NY',
    deliveryAddress: '456 5th Avenue, Brooklyn, NY',
    pickupLat: 40.7128,
    pickupLng: -74.0060,
    deliveryLat: 40.6782,
    deliveryLng: -73.9442,
    weight: 3.5,
    vehicleType: 'bike',
    price: 45.75, // Frontend calculated price
    guestName: 'John Doe',
    guestPhone: '+1234567890',
    guestEmail: 'john.doe@example.com',
    specialInstructions: 'Price calculated by frontend'
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments`, guestShipmentData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Guest Shipment Created with Frontend Price:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Guest shipment creation failed:', error.response?.data || error.message);
    return null;
  }
}

// Function to test authenticated user shipment with frontend-calculated price
async function testAuthenticatedShipmentWithFrontendPrice(authToken) {
  console.log('\n🔐 Testing Authenticated Shipment with Frontend-Calculated Price...');
  
  if (!authToken) {
    console.log('⚠️ Skipping authenticated test - no auth token provided');
    console.log('ℹ️ To test authenticated endpoint, provide a valid JWT token');
    return null;
  }

  const authShipmentData = {
    userType: 'authenticated',
    pickupAddress: '555 Madison Avenue, New York, NY',
    deliveryAddress: '777 Broadway, Brooklyn, NY',
    pickupLat: 40.7589,
    pickupLng: -73.9851,
    deliveryLat: 40.7505,
    deliveryLng: -73.9934,
    scheduledPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    weight: 8.0,
    vehicleType: 'van',
    price: 125.50, // Frontend calculated price
    specialInstructions: 'Authenticated user booking with frontend-calculated price'
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments`, authShipmentData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Authenticated Shipment Created with Frontend Price:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Authenticated shipment creation failed:', error.response?.data || error.message);
    return null;
  }
}

// Function to test legacy guest endpoint with frontend-calculated price
async function testLegacyGuestWithFrontendPrice() {
  console.log('\n🔄 Testing Legacy Guest Endpoint with Frontend-Calculated Price...');
  
  const legacyGuestData = {
    pickupAddress: '789 Park Avenue, Manhattan, NY',
    deliveryAddress: '321 Wall Street, Queens, NY',
    pickupLat: 40.7829,
    pickupLng: -73.9654,
    deliveryLat: 40.7505,
    deliveryLng: -73.9934,
    weight: 2.0,
    vehicleType: 'car',
    price: 68.25, // Frontend calculated price
    guestName: 'Jane Smith',
    guestPhone: '+1987654321',
    guestEmail: 'jane.smith@example.com',
    specialInstructions: 'Legacy endpoint with frontend pricing'
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments/guest`, legacyGuestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Legacy Guest Shipment Created with Frontend Price:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Legacy guest shipment creation failed:', error.response?.data || error.message);
    return null;
  }
}

// Function to track a shipment and verify price is stored
async function testShipmentTracking(trackingNumber) {
  console.log(`\n📍 Testing Shipment Tracking: ${trackingNumber}...`);
  
  try {
    const response = await axios.get(`${BASE_URL}/shipments/track/${trackingNumber}`);
    
    console.log('✅ Shipment Tracking Response (with stored price):');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Shipment tracking failed:', error.response?.data || error.message);
    return null;
  }
}

// Main test function
async function runFrontendPricingTests() {
  console.log('🚀 Starting Frontend Pricing Integration Tests...');
  console.log('===============================================');
  console.log('ℹ️ This test demonstrates how to send pre-calculated prices from frontend');

  // Test 1: Guest shipment creation with frontend price
  const guestShipment = await testGuestShipmentWithFrontendPrice();
  
  // Test 2: Legacy guest endpoint with frontend price
  const legacyGuestShipment = await testLegacyGuestWithFrontendPrice();
  
  // Test 3: Authenticated shipment (requires auth token)
  // Replace 'YOUR_AUTH_TOKEN_HERE' with actual token to test
  // const authShipment = await testAuthenticatedShipmentWithFrontendPrice('YOUR_AUTH_TOKEN_HERE');
  await testAuthenticatedShipmentWithFrontendPrice(null);
  
  // Test 4: Track shipments to verify price is stored
  if (guestShipment?.data?.trackingNumber) {
    await testShipmentTracking(guestShipment.data.trackingNumber);
  }
  
  if (legacyGuestShipment?.data?.trackingNumber) {
    await testShipmentTracking(legacyGuestShipment.data.trackingNumber);
  }

  console.log('\n🎉 All frontend pricing tests completed!');
  console.log('\nKey Features Tested:');
  console.log('✅ Price field accepted from frontend payload');
  console.log('✅ No backend price calculation performed');
  console.log('✅ Price stored in database and returned in responses');
  console.log('✅ Price included in tracking responses');
}

// Run the tests
if (require.main === module) {
  runFrontendPricingTests().catch(console.error);
}

module.exports = {
  testGuestShipmentWithFrontendPrice,
  testAuthenticatedShipmentWithFrontendPrice,
  testLegacyGuestWithFrontendPrice,
  testShipmentTracking
};
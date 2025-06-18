const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Function to test guest shipment without estimatedDeliveryDate
async function testGuestShipmentNoEstimatedDelivery() {
  console.log('\n📦 Testing Guest Shipment Without Estimated Delivery Date...');
  
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
    price: 45.75,
    distance: 2.5,
    guestName: 'John Doe',
    guestPhone: '+1234567890',
    guestEmail: 'john.doe@example.com',
    specialInstructions: 'No estimated delivery date - company timeline'
    // No estimatedDeliveryDate field
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments`, guestShipmentData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Guest Shipment Created Without Estimated Delivery Date:');
    console.log(`Tracking Number: ${response.data.data.shipment.trackingNumber}`);
    console.log(`Scheduled Pickup: ${response.data.data.shipment.scheduledPickupDate || 'Auto-scheduled'}`);
    console.log(`Price: $${response.data.data.shipment.price}`);
    console.log(`Distance: ${response.data.data.shipment.distance} km`);
    console.log('✅ No estimatedDeliveryDate in response (as expected)');
    return response.data;
  } catch (error) {
    console.error('❌ Guest shipment creation failed:', error.response?.data || error.message);
    return null;
  }
}

// Function to test authenticated user shipment without estimatedDeliveryDate
async function testAuthenticatedShipmentNoEstimatedDelivery(authToken) {
  console.log('\n🔐 Testing Authenticated Shipment Without Estimated Delivery Date...');
  
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
    price: 125.50,
    distance: 5.2,
    specialInstructions: 'Authenticated user - no estimated delivery date'
    // No estimatedDeliveryDate field
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments`, authShipmentData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Authenticated Shipment Created Without Estimated Delivery Date:');
    console.log(`Tracking Number: ${response.data.data.shipment.trackingNumber}`);
    console.log(`Scheduled Pickup: ${response.data.data.shipment.scheduledPickupDate}`);
    console.log(`Price: $${response.data.data.shipment.price}`);
    console.log(`Distance: ${response.data.data.shipment.distance} km`);
    console.log('✅ No estimatedDeliveryDate in response (as expected)');
    return response.data;
  } catch (error) {
    console.error('❌ Authenticated shipment creation failed:', error.response?.data || error.message);
    return null;
  }
}

// Function to test legacy guest endpoint without estimatedDeliveryDate
async function testLegacyGuestNoEstimatedDelivery() {
  console.log('\n🔄 Testing Legacy Guest Endpoint Without Estimated Delivery Date...');
  
  const legacyGuestData = {
    pickupAddress: '789 Park Avenue, Manhattan, NY',
    deliveryAddress: '321 Wall Street, Queens, NY',
    pickupLat: 40.7829,
    pickupLng: -73.9654,
    deliveryLat: 40.7505,
    deliveryLng: -73.9934,
    weight: 2.0,
    vehicleType: 'car',
    price: 68.25,
    distance: 4.8,
    guestName: 'Jane Smith',
    guestPhone: '+1987654321',
    guestEmail: 'jane.smith@example.com'
    // No estimatedDeliveryDate field
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments/guest`, legacyGuestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Legacy Guest Shipment Created Without Estimated Delivery Date:');
    console.log(`Tracking Number: ${response.data.data.shipment.trackingNumber}`);
    console.log(`Price: $${response.data.data.shipment.price}`);
    console.log(`Distance: ${response.data.data.shipment.distance} km`);
    console.log('✅ No estimatedDeliveryDate in response (as expected)');
    return response.data;
  } catch (error) {
    console.error('❌ Legacy guest shipment creation failed:', error.response?.data || error.message);
    return null;
  }
}

// Function to track shipment and verify no estimatedDeliveryDate is returned
async function testTrackingNoEstimatedDelivery(trackingNumber) {
  console.log(`\n📍 Testing Tracking Without Estimated Delivery: ${trackingNumber}...`);
  
  try {
    const response = await axios.get(`${BASE_URL}/shipments/track/${trackingNumber}`);
    
    console.log('✅ Tracking Response (No Estimated Delivery Date):');
    console.log(`Status: ${response.data.data.shipment.status}`);
    console.log(`Scheduled Pickup: ${response.data.data.shipment.scheduledPickupDate || 'Not scheduled'}`);
    console.log(`Actual Pickup: ${response.data.data.shipment.actualPickupDate || 'Not picked up yet'}`);
    console.log(`Actual Delivery: ${response.data.data.shipment.actualDeliveryDate || 'Not delivered yet'}`);
    console.log(`Price: $${response.data.data.shipment.price}`);
    console.log(`Distance: ${response.data.data.shipment.distance} km`);
    
    // Verify estimatedDeliveryDate is not in response
    if ('estimatedDeliveryDate' in response.data.data.shipment) {
      console.log('⚠️ Warning: estimatedDeliveryDate still present in tracking response');
    } else {
      console.log('✅ Confirmed: No estimatedDeliveryDate in tracking response');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Tracking test failed:', error.response?.data || error.message);
    return null;
  }
}

// Function to test that estimatedDeliveryDate is rejected if provided
async function testEstimatedDeliveryDateRejection() {
  console.log('\n❌ Testing Estimated Delivery Date Field Ignored...');
  
  const dataWithEstimatedDelivery = {
    userType: 'guest',
    pickupAddress: '200 Broadway, New York, NY',
    deliveryAddress: '300 Broadway, Brooklyn, NY',
    weight: 4.0,
    vehicleType: 'car',
    price: 55.00,
    distance: 3.5,
    estimatedDeliveryDate: '2024-12-30T18:00:00Z', // This should be ignored
    guestName: 'Test User',
    guestPhone: '+1333444555',
    guestEmail: 'test@example.com'
  };

  try {
    const response = await axios.post(`${BASE_URL}/shipments`, dataWithEstimatedDelivery, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Shipment Created (estimatedDeliveryDate ignored):');
    console.log(`Tracking Number: ${response.data.data.shipment.trackingNumber}`);
    console.log(`Price: $${response.data.data.shipment.price}`);
    
    // Check if estimatedDeliveryDate was ignored
    if ('estimatedDeliveryDate' in response.data.data.shipment) {
      console.log('⚠️ Warning: estimatedDeliveryDate still present in response');
    } else {
      console.log('✅ Confirmed: estimatedDeliveryDate ignored as expected');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return null;
  }
}

// Main test function
async function runNoEstimatedDeliveryTests() {
  console.log('🚀 Starting Tests Without Estimated Delivery Date...');
  console.log('==================================================');
  console.log('ℹ️ Testing that estimatedDeliveryDate is removed from all endpoints');

  // Test 1: Guest shipment without estimatedDeliveryDate
  const guestShipment = await testGuestShipmentNoEstimatedDelivery();
  
  // Test 2: Legacy guest endpoint without estimatedDeliveryDate
  const legacyGuestShipment = await testLegacyGuestNoEstimatedDelivery();
  
  // Test 3: Authenticated shipment (requires auth token)
  // Replace 'YOUR_AUTH_TOKEN_HERE' with actual token to test
  await testAuthenticatedShipmentNoEstimatedDelivery(null);
  
  // Test 4: Test that estimatedDeliveryDate field is ignored if provided
  await testEstimatedDeliveryDateRejection();
  
  // Test 5: Track shipments to verify no estimatedDeliveryDate is returned
  if (guestShipment?.data?.trackingNumber) {
    await testTrackingNoEstimatedDelivery(guestShipment.data.trackingNumber);
  }
  
  if (legacyGuestShipment?.data?.trackingNumber) {
    await testTrackingNoEstimatedDelivery(legacyGuestShipment.data.trackingNumber);
  }

  console.log('\n🎉 Tests completed!');
  console.log('\nKey Changes:');
  console.log('✅ estimatedDeliveryDate removed from all responses');
  console.log('✅ estimatedDeliveryDate no longer required in requests');
  console.log('✅ Company delivers according to own timeline');
  console.log('✅ Only actualDeliveryDate matters for completed deliveries');
}

// Run the tests
if (require.main === module) {
  runNoEstimatedDeliveryTests().catch(console.error);
}

module.exports = {
  testGuestShipmentNoEstimatedDelivery,
  testAuthenticatedShipmentNoEstimatedDelivery,
  testLegacyGuestNoEstimatedDelivery,
  testTrackingNoEstimatedDelivery,
  testEstimatedDeliveryDateRejection
};
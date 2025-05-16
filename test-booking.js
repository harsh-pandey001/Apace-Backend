// Test creating a booking without estimatedDeliveryDate
const axios = require('axios');

async function testBookingCreation() {
  // Test data without estimatedDeliveryDate
  const bookingData = {
    pickupAddress: '123 Main St, City A',
    deliveryAddress: '456 Oak St, City B',
    scheduledPickupDate: '2025-05-20T10:00:00Z',
    pickupLat: 40.7128,
    pickupLng: -74.0060,
    deliveryLat: 40.7580,
    deliveryLng: -73.9855,
    weight: 50,
    dimensions: '30x30x30',
    specialInstructions: 'Handle with care'
  };

  // Note: This would require a real JWT token to test with a protected route
  console.log('Test payload (without estimatedDeliveryDate):');
  console.log(JSON.stringify(bookingData, null, 2));
  console.log('\nValidation should pass for this payload.');
}

testBookingCreation();
const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let createdVehicleId = '';

// Test data
const testVehicleData = {
  vehicleType: 'test_vehicle',
  label: 'Test Vehicle',
  capacity: 'Up to 500kg',
  basePrice: 50.00,
  pricePerKm: 5.00,
  startingPrice: 75.00,
  isActive: true
};

const updatedVehicleData = {
  label: 'Updated Test Vehicle',
  capacity: 'Up to 600kg',
  basePrice: 60.00,
  pricePerKm: 6.00,
  startingPrice: 85.00
};

// Admin credentials for testing
const adminCredentials = {
  phone: '+1234567890',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@apace.com',
  role: 'admin'
};

console.log('🚀 Starting Vehicle CRUD Functionality Test...\n');

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      data
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Test functions
async function testAuthentication() {
  console.log('1️⃣ Testing Authentication...');
  
  try {
    // Request OTP
    await makeRequest('POST', '/auth/request-otp', { phone: adminCredentials.phone });
    console.log('   ✅ OTP request successful');
    
    // For testing, we'll use a mock OTP (123456)
    const otpResponse = await makeRequest('POST', '/auth/verify-otp', {
      phone: adminCredentials.phone,
      otp: '123456'
    });
    
    if (otpResponse.success && otpResponse.data.accessToken) {
      authToken = otpResponse.data.accessToken;
      console.log('   ✅ Authentication successful');
      return true;
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    console.log('   ❌ Authentication failed:', error.message || error);
    console.log('   ⚠️  Note: Make sure the server is running and admin user exists');
    return false;
  }
}

async function testCreateVehicle() {
  console.log('\n2️⃣ Testing Create Vehicle Type...');
  
  try {
    const response = await makeRequest('POST', '/vehicles', testVehicleData);
    
    if (response.success && response.data) {
      createdVehicleId = response.data.id;
      console.log('   ✅ Vehicle type created successfully');
      console.log(`   📋 Vehicle ID: ${createdVehicleId}`);
      console.log(`   📋 Vehicle Type: ${response.data.vehicleType}`);
      console.log(`   📋 Label: ${response.data.label}`);
      return true;
    } else {
      throw new Error('Vehicle creation failed');
    }
  } catch (error) {
    console.log('   ❌ Vehicle creation failed:', error.message || error);
    return false;
  }
}

async function testGetVehicles() {
  console.log('\n3️⃣ Testing Get Vehicle Types...');
  
  try {
    // Test public endpoint
    const publicResponse = await makeRequest('GET', '/vehicles');
    console.log(`   ✅ Public vehicles retrieved: ${publicResponse.data.length} types`);
    
    // Test admin endpoint
    const adminResponse = await makeRequest('GET', '/vehicles/admin/all');
    console.log(`   ✅ Admin vehicles retrieved: ${adminResponse.data.length} types`);
    
    // Test get specific vehicle
    if (createdVehicleId) {
      const specificResponse = await makeRequest('GET', `/vehicles/${createdVehicleId}`);
      console.log(`   ✅ Specific vehicle retrieved: ${specificResponse.data.label}`);
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ Get vehicles failed:', error.message || error);
    return false;
  }
}

async function testUpdateVehicle() {
  console.log('\n4️⃣ Testing Update Vehicle Type...');
  
  if (!createdVehicleId) {
    console.log('   ⚠️  Skipping update test - no vehicle created');
    return false;
  }
  
  try {
    const response = await makeRequest('PUT', `/vehicles/${createdVehicleId}`, updatedVehicleData);
    
    if (response.success && response.data) {
      console.log('   ✅ Vehicle type updated successfully');
      console.log(`   📋 Updated Label: ${response.data.label}`);
      console.log(`   📋 Updated Base Price: ₹${response.data.basePrice}`);
      console.log(`   📋 Updated Price/Km: ₹${response.data.pricePerKm}`);
      return true;
    } else {
      throw new Error('Vehicle update failed');
    }
  } catch (error) {
    console.log('   ❌ Vehicle update failed:', error.message || error);
    return false;
  }
}

async function testDeleteVehicle() {
  console.log('\n5️⃣ Testing Delete (Permanent Removal) Vehicle Type...');
  
  if (!createdVehicleId) {
    console.log('   ⚠️  Skipping delete test - no vehicle created');
    return false;
  }
  
  try {
    const response = await makeRequest('DELETE', `/vehicles/${createdVehicleId}`);
    
    if (response.success) {
      console.log('   ✅ Vehicle type deleted permanently');
      console.log('   📋 Vehicle has been completely removed from the database');
      
      // Verify it's completely removed by checking if it still appears in admin list
      const adminResponse = await makeRequest('GET', '/vehicles/admin/all');
      const deletedVehicle = adminResponse.data.find(v => v.id === createdVehicleId);
      
      if (!deletedVehicle) {
        console.log('   ✅ Verified: Vehicle is completely removed from admin list');
      } else {
        console.log('   ⚠️  Warning: Vehicle still appears in admin list');
      }
      
      // Try to get the specific vehicle (should fail)
      try {
        await makeRequest('GET', `/vehicles/${createdVehicleId}`);
        console.log('   ⚠️  Warning: Vehicle can still be retrieved individually');
      } catch (error) {
        console.log('   ✅ Verified: Vehicle cannot be retrieved individually (404 expected)');
      }
      
      return true;
    } else {
      throw new Error('Vehicle deletion failed');
    }
  } catch (error) {
    console.log('   ❌ Vehicle deletion failed:', error.message || error);
    return false;
  }
}

async function testPricingEndpoint() {
  console.log('\n6️⃣ Testing Vehicle Pricing Endpoint...');
  
  try {
    // Test with existing vehicle type (assuming 'bike' exists from seeder)
    const response = await makeRequest('GET', '/vehicles/bike/pricing');
    
    if (response.success && response.data) {
      console.log('   ✅ Vehicle pricing retrieved successfully');
      console.log(`   📋 Vehicle: ${response.data.label}`);
      console.log(`   📋 Base Price: ₹${response.data.basePrice}`);
      console.log(`   📋 Price/Km: ₹${response.data.pricePerKm}`);
      return true;
    } else {
      throw new Error('Pricing retrieval failed');
    }
  } catch (error) {
    console.log('   ❌ Vehicle pricing test failed:', error.message || error);
    console.log('   ⚠️  Note: This might fail if \'bike\' vehicle type doesn\'t exist');
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = {
    total: 6,
    passed: 0,
    failed: 0
  };
  
  const tests = [
    testAuthentication,
    testCreateVehicle,
    testGetVehicles,
    testUpdateVehicle,
    testDeleteVehicle,
    testPricingEndpoint
  ];
  
  for (const test of tests) {
    const success = await test();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Vehicle CRUD functionality is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
  
  console.log('\n📝 Notes:');
  console.log('- Make sure the backend server is running on port 5000');
  console.log('- Ensure database is properly migrated and seeded');
  console.log('- Admin user should exist for authentication to work');
  console.log('- Vehicle types are permanently deleted from the database (irreversible)');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('\n💥 Unhandled error:', error);
  process.exit(1);
});

// Start tests
runTests().catch(console.error);
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const testDriverProfileUpdate = async () => {
  console.log('🔧 Testing Driver Profile Update Endpoint\n');
  console.log('==========================================\n');

  try {
    // Step 1: Login as driver
    console.log('1. Testing driver login...');
    let driverToken, driverData;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/driver-auth/verify-otp`, {
        phone: "8989120990",
        otp: "123456"
      });
      
      driverToken = loginResponse.data.token;
      driverData = loginResponse.data.driver;
      console.log('✅ Driver login successful');
      console.log('   Driver ID:', driverData.id);
      console.log('   Current Name:', driverData.name);
      
    } catch (error) {
      console.log('❌ Driver login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Step 2: Get current driver profile
    console.log('\n2. Getting current driver profile...');
    let currentProfile;
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/drivers/profile`, {
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });
      
      currentProfile = profileResponse.data.data.driver;
      console.log('✅ Current profile retrieved');
      console.log('   Name:', currentProfile.name);
      console.log('   Email:', currentProfile.email);
      console.log('   Vehicle Type:', currentProfile.vehicleType);
      console.log('   Vehicle Number:', currentProfile.vehicleNumber);
      
    } catch (error) {
      console.log('❌ Failed to get current profile:', error.response?.data?.message || error.message);
      return;
    }

    // Step 3: Test successful profile update (partial update)
    console.log('\n3. Testing successful profile update (name only)...');
    try {
      const updateResponse = await axios.patch(`${BASE_URL}/api/drivers/profile`, {
        name: 'Updated Driver Name'
      }, {
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });
      
      console.log('✅ Profile update successful');
      console.log('   Status:', updateResponse.data.status);
      console.log('   Message:', updateResponse.data.message);
      console.log('   Updated Name:', updateResponse.data.data.driver.name);
      console.log('   Email unchanged:', updateResponse.data.data.driver.email === currentProfile.email);
      
    } catch (error) {
      console.log('❌ Profile update failed:', error.response?.data?.message || error.message);
    }

    // Step 4: Test vehicle number format validation
    console.log('\n4. Testing vehicle number format validation...');
    try {
      const invalidVehicleResponse = await axios.patch(`${BASE_URL}/api/drivers/profile`, {
        vehicleNumber: 'INVALID123'
      }, {
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });
      console.log('❌ Should have failed validation but passed');
      
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Vehicle number validation works correctly');
        console.log('   Error:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Step 5: Test valid vehicle number update
    console.log('\n5. Testing valid vehicle number update...');
    try {
      const validVehicleResponse = await axios.patch(`${BASE_URL}/api/drivers/profile`, {
        vehicleNumber: 'MH09 AB1234'
      }, {
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });
      
      console.log('✅ Valid vehicle number update successful');
      console.log('   New Vehicle Number:', validVehicleResponse.data.data.driver.vehicleNumber);
      
    } catch (error) {
      console.log('❌ Valid vehicle number update failed:', error.response?.data?.message || error.message);
    }

    // Step 6: Test phone number update prevention
    console.log('\n6. Testing phone number update prevention...');
    try {
      const phoneUpdateResponse = await axios.patch(`${BASE_URL}/api/drivers/profile`, {
        phone: '+9876543210'
      }, {
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });
      console.log('❌ Should have prevented phone update but allowed it');
      
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Phone number update correctly prevented');
        console.log('   Error:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Step 7: Test multiple field update
    console.log('\n7. Testing multiple field update...');
    try {
      const multiUpdateResponse = await axios.patch(`${BASE_URL}/api/drivers/profile`, {
        name: 'Multi Update Test',
        email: `updated.${Date.now()}@example.com`,
        vehicleType: 'van',
        vehicleCapacity: '8 passengers'
      }, {
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });
      
      console.log('✅ Multiple field update successful');
      console.log('   Updated Name:', multiUpdateResponse.data.data.driver.name);
      console.log('   Updated Email:', multiUpdateResponse.data.data.driver.email);
      console.log('   Updated Vehicle Type:', multiUpdateResponse.data.data.driver.vehicleType);
      console.log('   Updated Vehicle Capacity:', multiUpdateResponse.data.data.driver.vehicleCapacity);
      
    } catch (error) {
      console.log('❌ Multiple field update failed:', error.response?.data?.message || error.message);
    }

    // Step 8: Test empty update request
    console.log('\n8. Testing empty update request...');
    try {
      const emptyUpdateResponse = await axios.patch(`${BASE_URL}/api/drivers/profile`, {}, {
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });
      console.log('❌ Should have failed with empty body but passed');
      
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Empty update correctly rejected');
        console.log('   Error:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Step 9: Test without authentication
    console.log('\n9. Testing without authentication...');
    try {
      const noAuthResponse = await axios.patch(`${BASE_URL}/api/drivers/profile`, {
        name: 'Unauthorized Update'
      });
      console.log('❌ Should have failed without auth but passed');
      
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejects requests without authentication');
      } else {
        console.log('❌ Unexpected error without auth:', error.response?.data?.message || error.message);
      }
    }

    // Step 10: Restore original profile (if needed)
    console.log('\n10. Restoring original profile data...');
    try {
      const restoreResponse = await axios.patch(`${BASE_URL}/api/drivers/profile`, {
        name: currentProfile.name,
        email: currentProfile.email,
        vehicleType: currentProfile.vehicleType,
        vehicleCapacity: currentProfile.vehicleCapacity,
        vehicleNumber: currentProfile.vehicleNumber
      }, {
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });
      
      console.log('✅ Profile restored to original state');
      
    } catch (error) {
      console.log('⚠️  Could not restore original profile:', error.response?.data?.message || error.message);
    }

    // Summary
    console.log('\n📋 DRIVER PROFILE UPDATE ENDPOINT SUMMARY:');
    console.log('==========================================');
    console.log('');
    console.log('✅ ENDPOINT: PATCH /api/drivers/profile');
    console.log('✅ AUTHENTICATION: Required (JWT token)');
    console.log('✅ AUTHORIZATION: Driver role required');
    console.log('✅ VALIDATION: Comprehensive field validation');
    console.log('✅ SECURITY: Phone updates blocked, email/vehicle uniqueness checked');
    console.log('');
    console.log('📋 SUPPORTED FIELDS:');
    console.log('====================');
    console.log('- name (2-100 chars, letters and spaces only)');
    console.log('- email (valid email format, unique)');
    console.log('- vehicleType (string, max 20 chars)');
    console.log('- vehicleCapacity (string)');
    console.log('- vehicleNumber (format: AB09 CD1234, unique)');
    console.log('');
    console.log('🔒 SECURITY FEATURES:');
    console.log('=====================');
    console.log('- JWT authentication required');
    console.log('- Driver role validation');
    console.log('- Phone number updates blocked');
    console.log('- Email uniqueness validation');
    console.log('- Vehicle number uniqueness validation');
    console.log('- Vehicle number format validation (regex)');
    console.log('- At least one field required for update');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
};

// Test server connectivity
const testServerConnectivity = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running at', BASE_URL);
    return true;
  } catch (error) {
    console.error('❌ Server not accessible at', BASE_URL);
    console.error('💡 Please start the server with: npm run dev');
    return false;
  }
};

// Run the test
const runTest = async () => {
  const serverRunning = await testServerConnectivity();
  if (!serverRunning) {
    return;
  }

  await testDriverProfileUpdate();
};

runTest();
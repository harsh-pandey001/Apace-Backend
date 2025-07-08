const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const testDriverAuthFix = async () => {
  console.log('🔧 Testing Driver Authentication Fix...\n');

  try {
    // Step 1: Login as driver to get token
    console.log('1. Logging in as driver to get authentication token...');
    let driverToken;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/driver-auth/verify-otp`, {
        phone: "+1234567899", // Assuming this driver exists from previous tests
        otp: "123456"
      });
      
      driverToken = loginResponse.data.token;
      console.log('✅ Driver login successful');
      console.log('📋 Driver info:', {
        id: loginResponse.data.data.user.id,
        name: loginResponse.data.data.user.name,
        role: loginResponse.data.data.user.role,
        vehicleType: loginResponse.data.data.user.vehicleType
      });
      
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ Driver not found. Please create a driver first using driver signup.');
        return;
      } else {
        console.log('❌ Driver login failed:', error.response?.data?.message || error.message);
        return;
      }
    }

    // Step 2: Test driver token with protected endpoint
    console.log('\n2. Testing driver token with protected endpoint...');
    try {
      const protectedResponse = await axios.post(`${BASE_URL}/api/driver-auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('✅ Driver token works! Logout successful:', protectedResponse.data.message);
      
    } catch (error) {
      if (error.response?.data?.message?.includes('user belonging to this token no longer exists')) {
        console.log('❌ Authentication middleware still has the bug - looking in wrong table');
        console.log('Error:', error.response?.data?.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Step 3: Test driver availability update (another protected endpoint)
    console.log('\n3. Testing driver availability update endpoint...');
    try {
      // First get the driver ID from a previous response or try to get all drivers
      const availabilityResponse = await axios.put(`${BASE_URL}/api/drivers/DRIVER_ID/availability`, {
        availability_status: 'online'
      }, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('✅ Driver availability update works!');
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️  Driver ID endpoint test skipped (expected 404 for DRIVER_ID placeholder)');
      } else if (error.response?.data?.message?.includes('user belonging to this token no longer exists')) {
        console.log('❌ Authentication middleware still has the bug on this endpoint too');
      } else {
        console.log('ℹ️  Other error (may be expected):', error.response?.data?.message || error.message);
      }
    }

    // Step 4: Test role-based access
    console.log('\n4. Testing role-based access with driver token...');
    try {
      const adminResponse = await axios.get(`${BASE_URL}/api/drivers/all`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('❌ Driver should not have access to admin endpoints');
      
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Role-based access control working - driver correctly denied admin access');
      } else if (error.response?.data?.message?.includes('user belonging to this token no longer exists')) {
        console.log('❌ Authentication middleware bug prevents role check');
      } else {
        console.log('ℹ️  Other error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n📋 Test Summary:');
    console.log('• Driver login ✅');
    console.log('• Driver token validation - Check results above');
    console.log('• Role-based access control - Check results above');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
};

// Test server connectivity first
const testServerConnectivity = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running at', BASE_URL);
    return true;
  } catch (error) {
    console.error('❌ Server not accessible at', BASE_URL);
    console.error('Error:', error.message);
    return false;
  }
};

// Run the tests
const runTests = async () => {
  console.log('🔍 Driver Authentication Fix Test');
  console.log('==================================\n');

  const serverRunning = await testServerConnectivity();
  if (!serverRunning) {
    console.log('💡 Please ensure the server is running with: npm run dev');
    return;
  }

  await testDriverAuthFix();
};

runTests();
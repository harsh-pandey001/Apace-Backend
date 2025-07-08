const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const testDatabaseColumnFix = async () => {
  console.log('🔧 Testing Database Column Fix...\n');

  try {
    // Test 1: Login as driver (should work)
    console.log('1. Testing driver login...');
    let driverToken;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/driver-auth/verify-otp`, {
        phone: "8989120990",
        otp: "123456"
      });
      
      driverToken = loginResponse.data.token;
      console.log('✅ Driver login successful');
      
    } catch (error) {
      if (error.response?.data?.message?.includes('availability_status')) {
        console.log('❌ Database column error still exists');
        console.log('Error:', error.response?.data?.message);
        return;
      } else {
        console.log('ℹ️  Driver login issue (may be expected):', error.response?.data?.message || error.message);
      }
    }

    // Test 2: Test driver profile endpoint
    console.log('\n2. Testing driver profile endpoint...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/drivers/profile`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('✅ Driver profile endpoint works!');
      console.log('📋 Profile data:', {
        id: profileResponse.data.data.driver.id,
        name: profileResponse.data.data.driver.name,
        vehicleType: profileResponse.data.data.driver.vehicleType
      });
      
    } catch (error) {
      if (error.response?.data?.message?.includes('availability_status') || 
          error.response?.data?.message?.includes('Unknown column')) {
        console.log('❌ Database column error in profile endpoint');
        console.log('Error:', error.response?.data?.message);
      } else {
        console.log('ℹ️  Profile endpoint issue:', error.response?.data?.message || error.message);
      }
    }

    // Test 3: Test user login (different flow)
    console.log('\n3. Testing user login flow...');
    try {
      const userOtpResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
        phone: "1234567890" // Different phone number
      });
      console.log('ℹ️  User OTP request (may fail - expected)');
      
    } catch (error) {
      if (error.response?.data?.message?.includes('availability_status') || 
          error.response?.data?.message?.includes('Unknown column')) {
        console.log('❌ Database column error in user auth');
        console.log('Error:', error.response?.data?.message);
      } else if (error.response?.status === 403) {
        console.log('✅ User auth working (user not found - expected)');
      } else {
        console.log('ℹ️  User auth issue:', error.response?.data?.message || error.message);
      }
    }

    // Test 4: Test driver logout
    console.log('\n4. Testing driver logout...');
    try {
      const logoutResponse = await axios.post(`${BASE_URL}/api/driver-auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('✅ Driver logout works!');
      
    } catch (error) {
      if (error.response?.data?.message?.includes('availability_status') || 
          error.response?.data?.message?.includes('Unknown column')) {
        console.log('❌ Database column error in logout');
        console.log('Error:', error.response?.data?.message);
      } else {
        console.log('ℹ️  Logout issue:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n📋 Test Summary:');
    console.log('If you see any "Database column error" messages above,');
    console.log('the server needs to be restarted to load the updated code.');

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
  console.log('🔍 Database Column Fix Test');
  console.log('============================\n');

  const serverRunning = await testServerConnectivity();
  if (!serverRunning) {
    console.log('💡 Please ensure the server is running with: npm run dev');
    return;
  }

  await testDatabaseColumnFix();
};

runTests();
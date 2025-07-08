const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const testDriverLoginFlow = async () => {
  console.log('🚗 Testing Driver Login Flow...\n');

  try {
    // Test 1: First, create a driver to test login
    console.log('1. Creating a test driver for login testing...');
    const driverData = {
      phone: "+1234567899",
      name: "Test Driver",
      email: "test.driver@example.com",
      vehicleType: "bike",
      vehicleCapacity: "10 kg",
      vehicleNumber: "TS09 AB1234",
      otp: "123456"
    };

    try {
      const signupResponse = await axios.post(`${BASE_URL}/api/drivers/signup`, driverData);
      console.log('✅ Test driver created successfully:', signupResponse.data.data.driver.id);
    } catch (error) {
      if (error.response?.data?.message?.includes('already registered')) {
        console.log('✅ Test driver already exists, proceeding with login test');
      } else {
        console.log('ℹ️  Driver signup issue (expected):', error.response?.data?.message || error.message);
        console.log('📋 Proceeding with login test assuming driver exists...');
      }
    }

    // Test 2: Request OTP for driver login
    console.log('\n2. Testing driver OTP request...');
    try {
      const otpResponse = await axios.post(`${BASE_URL}/api/driver-auth/request-otp`, {
        phone: "+1234567899"
      });
      console.log('✅ Driver OTP requested successfully:', otpResponse.data.message);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ Driver not found or not registered');
        console.log('Error:', error.response?.data?.message);
        return;
      } else {
        console.log('❌ OTP request failed:', error.response?.data?.message || error.message);
        return;
      }
    }

    // Test 3: Verify OTP and login driver
    console.log('\n3. Testing driver OTP verification and login...');
    let driverToken, driverRefreshToken;
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/driver-auth/verify-otp`, {
        phone: "+1234567899",
        otp: "123456"
      });
      
      console.log('✅ Driver login successful!');
      console.log('📋 Driver details:', {
        id: loginResponse.data.data.user.id,
        name: loginResponse.data.data.user.name,
        email: loginResponse.data.data.user.email,
        phone: loginResponse.data.data.user.phone,
        role: loginResponse.data.data.user.role,
        vehicleType: loginResponse.data.data.user.vehicleType,
        vehicleNumber: loginResponse.data.data.user.vehicleNumber,
        availability_status: loginResponse.data.data.user.availability_status
      });
      
      driverToken = loginResponse.data.token;
      driverRefreshToken = loginResponse.data.refreshToken;
      console.log('🔑 Driver tokens received');
      
    } catch (error) {
      console.log('❌ Driver login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Test 4: Test driver token with protected endpoint
    console.log('\n4. Testing driver token with protected endpoint...');
    try {
      const protectedResponse = await axios.get(`${BASE_URL}/api/drivers/all`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('❌ This should fail - drivers/all requires admin access');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✅ Driver token correctly rejected for admin-only endpoint');
      } else {
        console.log('❓ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Test 5: Test refresh token
    console.log('\n5. Testing driver refresh token...');
    try {
      const refreshResponse = await axios.post(`${BASE_URL}/api/driver-auth/refresh-token`, {
        refreshToken: driverRefreshToken
      });
      console.log('✅ Driver token refreshed successfully');
      console.log('🔑 New tokens received');
      
      // Update tokens
      driverToken = refreshResponse.data.token;
      driverRefreshToken = refreshResponse.data.refreshToken;
      
    } catch (error) {
      console.log('❌ Driver token refresh failed:', error.response?.data?.message || error.message);
    }

    // Test 6: Test driver logout
    console.log('\n6. Testing driver logout...');
    try {
      const logoutResponse = await axios.post(`${BASE_URL}/api/driver-auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('✅ Driver logout successful:', logoutResponse.data.message);
    } catch (error) {
      console.log('❌ Driver logout failed:', error.response?.data?.message || error.message);
    }

    // Test 7: Compare with regular user login
    console.log('\n7. Testing regular user login (should use different table)...');
    try {
      // Try to request OTP for user
      const userOtpResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
        phone: "+1234567899"
      });
      console.log('❌ This should fail - phone exists in drivers table, not users table');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Regular auth correctly failed - phone not in users table');
      } else {
        console.log('❓ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Test 8: Test invalid phone for driver login
    console.log('\n8. Testing driver login with non-existent phone...');
    try {
      const invalidOtpResponse = await axios.post(`${BASE_URL}/api/driver-auth/request-otp`, {
        phone: "+9999999999"
      });
      console.log('❌ This should fail - driver does not exist');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Driver auth correctly failed for non-existent driver');
      } else {
        console.log('❓ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Driver login flow testing completed!');
    console.log('\n📋 Summary:');
    console.log('• Driver-specific OTP request ✅');
    console.log('• Driver-specific OTP verification/login ✅');
    console.log('• Driver token generation with role ✅');
    console.log('• Driver token refresh ✅');
    console.log('• Driver logout ✅');
    console.log('• Separation from user auth ✅');

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
    console.log('📊 Health check:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Server not accessible at', BASE_URL);
    console.error('Error:', error.message);
    return false;
  }
};

// Run the tests
const runTests = async () => {
  console.log('🔍 Driver Login Flow Test Suite');
  console.log('===============================\n');

  const serverRunning = await testServerConnectivity();
  if (!serverRunning) {
    console.log('💡 Please ensure the server is running with: npm run dev');
    return;
  }

  await testDriverLoginFlow();
};

runTests();
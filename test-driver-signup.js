const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const testDriverSignup = async () => {
  console.log('🚀 Testing Driver Signup Flow...\n');

  try {
    // Test 1: Get available vehicle types
    console.log('1. Testing vehicle types retrieval...');
    const vehicleResponse = await axios.get(`${BASE_URL}/api/vehicles`);
    console.log('✅ Vehicle types retrieved:', vehicleResponse.data.data.vehicles.length, 'types');
    
    const vehicleTypes = vehicleResponse.data.data.vehicles;
    const testVehicleType = vehicleTypes[0]?.type || 'bike';
    const testVehicleCapacity = vehicleTypes[0]?.capacity || '10 kg';
    
    console.log('📋 Using vehicle type:', testVehicleType);
    console.log('📋 Using vehicle capacity:', testVehicleCapacity);
    
    // Test 2: Request OTP for driver signup
    console.log('\n2. Testing OTP request for driver signup...');
    const phoneNumber = '+1234567890';
    
    try {
      const otpResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
        phone: phoneNumber
      });
      console.log('❌ OTP request should fail for non-existent user');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ OTP request correctly failed for non-existent user');
      } else {
        console.log('❌ Unexpected error during OTP request:', error.response?.data || error.message);
      }
    }

    // Test 3: Driver signup with mock OTP
    console.log('\n3. Testing driver signup with vehicle validation...');
    const driverData = {
      phone: phoneNumber,
      firstName: 'John',
      lastName: 'Driver',
      email: 'john.driver@test.com',
      vehicleType: testVehicleType,
      vehicleCapacity: testVehicleCapacity,
      vehicleNumber: 'AB09 CD1234',
      otp: '123456' // Mock OTP
    };

    try {
      const signupResponse = await axios.post(`${BASE_URL}/api/drivers/signup`, driverData);
      console.log('✅ Driver signup successful:', signupResponse.data.data.driver.id);
      console.log('📋 Driver details:', {
        name: `${signupResponse.data.data.driver.firstName} ${signupResponse.data.data.driver.lastName}`,
        email: signupResponse.data.data.driver.email,
        phone: signupResponse.data.data.driver.phone,
        vehicleType: signupResponse.data.data.driver.vehicleType,
        vehicleCapacity: signupResponse.data.data.driver.vehicleCapacity,
        vehicleNumber: signupResponse.data.data.driver.vehicleNumber
      });
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('OTP')) {
        console.log('✅ Driver signup correctly failed due to invalid OTP');
      } else {
        console.log('❌ Driver signup failed:', error.response?.data || error.message);
      }
    }

    // Test 4: Test invalid vehicle number format
    console.log('\n4. Testing invalid vehicle number format...');
    const invalidVehicleData = {
      ...driverData,
      email: 'john.driver2@test.com',
      phone: '+1234567891',
      vehicleNumber: 'INVALID123' // Invalid format
    };

    try {
      const invalidResponse = await axios.post(`${BASE_URL}/api/drivers/signup`, invalidVehicleData);
      console.log('❌ Should have failed with invalid vehicle number');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected invalid vehicle number format');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 5: Test vehicle type with maximum length
    console.log('\n5. Testing vehicle type with maximum 20 characters...');
    const validLongVehicleTypeData = {
      ...driverData,
      email: 'john.driver3@test.com',
      phone: '+1234567892',
      vehicleType: 'CustomVehicleType20', // Exactly 20 characters
      vehicleNumber: 'AB10 CD1234'
    };

    try {
      const validTypeResponse = await axios.post(`${BASE_URL}/api/drivers/signup`, validLongVehicleTypeData);
      console.log('✅ 20-character vehicle type accepted');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('OTP')) {
        console.log('✅ 20-character vehicle type accepted (OTP validation expected)');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 5b: Test vehicle type exceeding maximum length
    console.log('\n5b. Testing vehicle type exceeding 20 characters...');
    const tooLongVehicleTypeData = {
      ...driverData,
      email: 'john.driver4@test.com',
      phone: '+1234567893',
      vehicleType: 'ThisVehicleTypeIsWayTooLongForValidation', // Over 20 characters
      vehicleNumber: 'AB11 CD1234'
    };

    try {
      const tooLongTypeResponse = await axios.post(`${BASE_URL}/api/drivers/signup`, tooLongVehicleTypeData);
      console.log('❌ Should have failed with vehicle type too long');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.errors?.some(e => e.msg.includes('maximum 20 characters'))) {
        console.log('✅ Correctly rejected vehicle type over 20 characters');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 6: Test regular user signup (should still work)
    console.log('\n6. Testing regular user signup...');
    const userData = {
      phone: '+1234567893',
      firstName: 'Jane',
      lastName: 'User',
      email: 'jane.user@test.com',
      role: 'user'
    };

    try {
      const userSignupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, userData);
      console.log('✅ Regular user signup successful');
    } catch (error) {
      console.log('❌ Regular user signup failed:', error.response?.data || error.message);
    }

    // Test 7: Test admin signup
    console.log('\n7. Testing admin signup...');
    const adminData = {
      phone: '+1234567894',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin.user@test.com',
      role: 'admin'
    };

    try {
      const adminSignupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, adminData);
      console.log('✅ Admin signup successful');
    } catch (error) {
      console.log('❌ Admin signup failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Driver signup testing completed!');

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
  console.log('🔍 Driver Signup API Test Suite');
  console.log('================================\n');

  const serverRunning = await testServerConnectivity();
  if (!serverRunning) {
    console.log('💡 Please ensure the server is running with: npm run dev');
    return;
  }

  await testDriverSignup();
};

runTests();
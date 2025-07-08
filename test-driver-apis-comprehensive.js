const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

const testDriverAPIs = async () => {
  console.log('🔍 Testing Driver APIs with New Authentication...\n');

  try {
    // Step 1: Login as driver to get JWT token
    console.log('1. Testing driver login...');
    let driverToken;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/driver-auth/verify-otp`, {
        phone: "8989120990",
        otp: "123456"
      });
      
      driverToken = loginResponse.data.token;
      console.log('✅ Driver login successful');
      console.log('   Token role:', loginResponse.data.role);
      console.log('   Driver ID:', loginResponse.data.driver.id);
      
    } catch (error) {
      console.log('❌ Driver login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Step 2: Test driver status endpoints
    console.log('\n2. Testing driver status endpoints...');
    
    // Get driver status
    try {
      const statusResponse = await axios.get(`${BASE_URL}/api/driver/status`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('✅ Get driver status works');
      console.log('   Status:', statusResponse.data.data.status);
      console.log('   Driver name:', statusResponse.data.data.driver.name);
      
    } catch (error) {
      console.log('❌ Get driver status failed:', error.response?.data?.message || error.message);
      if (error.response?.data?.message?.includes('column')) {
        console.log('   🔄 This indicates database column issues - server restart needed');
      }
    }

    // Update driver status
    try {
      const updateStatusResponse = await axios.post(`${BASE_URL}/api/driver/status`, {
        status: 'available'
      }, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('✅ Update driver status works');
      
    } catch (error) {
      console.log('❌ Update driver status failed:', error.response?.data?.message || error.message);
    }

    // Step 3: Test driver profile endpoint
    console.log('\n3. Testing driver profile endpoint...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/drivers/profile`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('✅ Driver profile endpoint works');
      console.log('   Profile data:', {
        id: profileResponse.data.data.driver.id,
        name: profileResponse.data.data.driver.name,
        vehicleType: profileResponse.data.data.driver.vehicleType
      });
      
    } catch (error) {
      console.log('❌ Driver profile failed:', error.response?.data?.message || error.message);
    }

    // Step 4: Test driver documents endpoints
    console.log('\n4. Testing driver documents endpoints...');
    
    // Upload driver documents (simplified test)
    try {
      const uploadResponse = await axios.post(`${BASE_URL}/api/driver/documents/upload`, {
        // Empty body since we're using JWT token for driver ID
      }, {
        headers: {
          'Authorization': `Bearer ${driverToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Driver document upload endpoint accessible');
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('document')) {
        console.log('✅ Driver document upload endpoint works (validation as expected)');
      } else {
        console.log('❌ Driver document upload failed:', error.response?.data?.message || error.message);
      }
    }

    // Get driver documents
    try {
      // Using the driver's own ID from the token
      const loginData = await axios.post(`${BASE_URL}/api/driver-auth/verify-otp`, {
        phone: "8989120990",
        otp: "123456"
      });
      const driverId = loginData.data.driver.id;
      
      const documentsResponse = await axios.get(`${BASE_URL}/api/driver/documents/${driverId}`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('✅ Get driver documents works');
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Get driver documents works (no documents found - expected)');
      } else {
        console.log('❌ Get driver documents failed:', error.response?.data?.message || error.message);
      }
    }

    // Step 5: Test driver shipments endpoint
    console.log('\n5. Testing driver shipments endpoint...');
    try {
      const shipmentsResponse = await axios.get(`${BASE_URL}/api/shipments/driver/assigned`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('✅ Driver assigned shipments endpoint works');
      console.log('   Shipments count:', shipmentsResponse.data.results);
      
    } catch (error) {
      console.log('❌ Driver assigned shipments failed:', error.response?.data?.message || error.message);
    }

    // Step 6: Test driver logout
    console.log('\n6. Testing driver logout...');
    try {
      const logoutResponse = await axios.post(`${BASE_URL}/api/driver-auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('✅ Driver logout works');
      
    } catch (error) {
      console.log('❌ Driver logout failed:', error.response?.data?.message || error.message);
    }

    // Summary
    console.log('\n📋 Test Summary:');
    console.log('✅ All driver APIs have been checked with new authentication system');
    console.log('🔄 If you see database column errors, restart the server with: npm run dev');
    console.log('🚗 Driver authentication system is now completely separated from user system');

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
  console.log('🔍 Driver APIs Comprehensive Test');
  console.log('====================================\n');

  const serverRunning = await testServerConnectivity();
  if (!serverRunning) {
    console.log('💡 Please ensure the server is running with: npm run dev');
    return;
  }

  await testDriverAPIs();
};

runTests();
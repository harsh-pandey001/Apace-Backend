const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const debugDriverDocuments = async () => {
  console.log('🔍 Debug Driver Documents Issue\n');
  console.log('================================\n');

  try {
    // Step 1: Login as driver and get actual driver ID
    console.log('1. Testing driver login to get actual driver ID...');
    let driverToken, driverData;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/driver-auth/verify-otp`, {
        phone: "8989120990",
        otp: "123456"
      });
      
      driverToken = loginResponse.data.token;
      driverData = loginResponse.data.driver;
      console.log('✅ Driver login successful');
      console.log('   Actual Driver ID:', driverData.id);
      console.log('   Driver Name:', driverData.name);
      console.log('   Driver Email:', driverData.email);
      
    } catch (error) {
      console.log('❌ Driver login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Step 2: Test with the actual driver ID from login
    console.log('\n2. Testing driver documents with actual driver ID...');
    try {
      const documentsResponse = await axios.get(`${BASE_URL}/api/driver/documents/${driverData.id}`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      
      console.log('✅ Driver documents endpoint works with actual ID');
      console.log('   Document status:', documentsResponse.data.data?.status || 'No documents');
      
    } catch (error) {
      console.log('❌ Driver documents failed with actual ID:', error.response?.data?.message || error.message);
      
      if (error.response?.status === 404) {
        if (error.response.data.message === 'Driver not found') {
          console.log('   🔍 This means the driver ID from login doesn\'t exist in drivers table');
        } else if (error.response.data.message === 'No documents found for this driver') {
          console.log('   ✅ Driver exists but has no documents uploaded yet (expected)');
        }
      }
    }

    // Step 3: Test with the problematic ID from the user
    console.log('\n3. Testing with the problematic ID from user...');
    const problematicId = 'b3e31f91-47b8-4a6a-ac8d-7eaa0e1674f1';
    try {
      const problemResponse = await axios.get(`${BASE_URL}/api/driver/documents/${problematicId}`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      
      console.log('✅ Problematic ID actually works');
      
    } catch (error) {
      console.log('❌ Problematic ID confirmed to fail:', error.response?.data?.message || error.message);
      console.log('   This confirms that driver ID', problematicId, 'does not exist in drivers table');
    }

    // Step 4: Test driver profile endpoint to compare
    console.log('\n4. Testing driver profile endpoint...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/drivers/profile`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      
      console.log('✅ Driver profile works');
      console.log('   Profile Driver ID:', profileResponse.data.data.driver.id);
      console.log('   Profile matches login:', profileResponse.data.data.driver.id === driverData.id);
      
    } catch (error) {
      console.log('❌ Driver profile failed:', error.response?.data?.message || error.message);
    }

    // Step 5: Analysis and recommendations
    console.log('\n📋 ANALYSIS:');
    console.log('=============');
    console.log('Actual Driver ID from login:', driverData.id);
    console.log('Problematic ID from user:', problematicId);
    console.log('IDs match:', driverData.id === problematicId);
    
    if (driverData.id !== problematicId) {
      console.log('');
      console.log('🔍 ROOT CAUSE:');
      console.log('==============');
      console.log('The driver ID in the URL doesn\'t match the actual driver ID in the database.');
      console.log('This could happen if:');
      console.log('1. Old/stale driver ID is being used');
      console.log('2. Driver was recreated with a new ID');
      console.log('3. Frontend is using wrong ID from previous sessions');
      console.log('');
      console.log('✅ SOLUTION:');
      console.log('============');
      console.log('Use the actual driver ID from the login response:');
      console.log(`GET ${BASE_URL}/api/driver/documents/${driverData.id}`);
      console.log('');
      console.log('Or better yet, modify the endpoint to use the authenticated driver\'s ID from the JWT token');
      console.log('instead of requiring it as a URL parameter.');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
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

// Run the debug
const runDebug = async () => {
  const serverRunning = await testServerConnectivity();
  if (!serverRunning) {
    return;
  }

  await debugDriverDocuments();
};

runDebug();
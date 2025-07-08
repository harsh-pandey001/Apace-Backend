const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const testDriverDocumentsFix = async () => {
  console.log('🔧 Testing Driver Documents Fix\n');
  console.log('==============================\n');

  try {
    // Step 1: Login as driver and get actual driver ID
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
      console.log('   Real Driver ID:', driverData.id);
      console.log('   Driver Name:', driverData.name);
      
    } catch (error) {
      console.log('❌ Driver login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Step 2: Test the problematic endpoint with wrong ID
    console.log('\n2. Testing problematic endpoint with wrong ID...');
    const wrongId = 'b3e31f91-47b8-4a6a-ac8d-7eaa0e1674f1';
    try {
      const wrongResponse = await axios.get(`${BASE_URL}/api/driver/documents/${wrongId}`, {
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });
      console.log('✅ Wrong ID somehow works');
      
    } catch (error) {
      console.log('❌ Wrong ID fails as expected:', error.response?.data?.message || error.message);
      console.log('   This confirms the issue: wrong driver ID doesn\'t exist in database');
    }

    // Step 3: Test the problematic endpoint with correct ID
    console.log('\n3. Testing problematic endpoint with correct ID...');
    try {
      const correctResponse = await axios.get(`${BASE_URL}/api/driver/documents/${driverData.id}`, {
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });
      console.log('✅ Correct ID works!');
      console.log('   Status:', correctResponse.data.success);
      console.log('   Message:', correctResponse.data.message || 'Documents found');
      
    } catch (error) {
      if (error.response?.status === 404 && error.response?.data?.message === 'No documents found for this driver') {
        console.log('✅ Correct ID works - no documents uploaded yet (expected)');
      } else {
        console.log('❌ Correct ID still fails:', error.response?.data?.message || error.message);
      }
    }

    // Step 4: Test the NEW secure endpoint that uses JWT token
    console.log('\n4. Testing NEW secure endpoint (/driver/documents/my)...');
    try {
      const myDocsResponse = await axios.get(`${BASE_URL}/api/driver/documents/my`, {
        headers: { 'Authorization': `Bearer ${driverToken}` }
      });
      console.log('✅ Secure endpoint works!');
      console.log('   Status:', myDocsResponse.data.success);
      console.log('   Driver ID:', myDocsResponse.data.data.driver_id);
      console.log('   Document status:', myDocsResponse.data.data.status);
      console.log('   Driving license uploaded:', myDocsResponse.data.data.documents.driving_license.uploaded);
      
    } catch (error) {
      console.log('❌ Secure endpoint failed:', error.response?.data?.message || error.message);
    }

    // Step 5: Test document upload endpoint
    console.log('\n5. Testing document upload endpoint...');
    try {
      const uploadResponse = await axios.post(`${BASE_URL}/api/driver/documents/upload`, {}, {
        headers: { 
          'Authorization': `Bearer ${driverToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Upload endpoint accessible');
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('document')) {
        console.log('✅ Upload endpoint works (validation error expected without files)');
      } else {
        console.log('❌ Upload endpoint failed:', error.response?.data?.message || error.message);
      }
    }

    // Step 6: Analysis and recommendations
    console.log('\n📋 ANALYSIS & SOLUTION:');
    console.log('========================');
    console.log('');
    console.log('🔍 PROBLEM IDENTIFIED:');
    console.log('Real Driver ID:', driverData.id);
    console.log('Wrong ID used:', wrongId);
    console.log('IDs match:', driverData.id === wrongId ? 'YES' : 'NO');
    console.log('');
    console.log('✅ SOLUTIONS PROVIDED:');
    console.log('======================');
    console.log('1. IMMEDIATE FIX: Use correct driver ID from login response');
    console.log(`   GET ${BASE_URL}/api/driver/documents/${driverData.id}`);
    console.log('');
    console.log('2. BETTER FIX: Use the new secure endpoint (recommended)');
    console.log(`   GET ${BASE_URL}/api/driver/documents/my`);
    console.log('   - Uses JWT token to identify driver (more secure)');
    console.log('   - No need to pass driver ID in URL');
    console.log('   - Prevents access to other drivers\' documents');
    console.log('');
    console.log('🎯 RECOMMENDED USAGE:');
    console.log('=====================');
    console.log('Frontend should use: GET /api/driver/documents/my');
    console.log('- More secure (uses authenticated driver ID)');
    console.log('- Simpler (no driver ID parameter needed)');
    console.log('- Returns proper structure even when no documents exist');

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

  await testDriverDocumentsFix();
};

runTest();
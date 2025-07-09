const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testModalIssue() {
    console.log('🔍 Testing Modal Issue Diagnosis...\n');

    try {
        // Test 1: Check if server is running
        console.log('📋 Test 1: Server health check');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is running:', healthResponse.status);
    } catch (error) {
        console.log('❌ Server health check failed:', error.message);
    }

    try {
        // Test 2: Check if we can get any response from the API
        console.log('\n📋 Test 2: API accessibility test');
        const response = await axios.get(`${BASE_URL}/api/users`);
        console.log('✅ API response status:', response.status);
    } catch (error) {
        console.log('❌ API access failed:', error.response?.status || error.message);
        console.log('❌ Error details:', error.response?.data || error.message);
    }

    try {
        // Test 3: Check if admin panel is reachable
        console.log('\n📋 Test 3: Admin panel accessibility test');
        const adminResponse = await axios.get('http://localhost:3000');
        console.log('✅ Admin panel is accessible:', adminResponse.status);
    } catch (error) {
        console.log('❌ Admin panel access failed:', error.message);
    }

    console.log('\n🎯 Diagnosis Summary:');
    console.log('   • If server is running but API fails = Authentication issue');
    console.log('   • If server is not running = Start backend server');
    console.log('   • If admin panel is not accessible = Start admin panel');
    console.log('   • Modal issue likely related to authentication token expiry');
}

testModalIssue();
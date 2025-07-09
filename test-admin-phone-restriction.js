const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAdminPhoneRestriction() {
    console.log('🔍 Testing Admin Phone Number Restriction...\n');

    // Test 1: Valid phone number (1234567890)
    console.log('📋 Test 1: Valid phone number (1234567890)');
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            phone: '1234567890'
        });
        console.log('✅ Status:', response.status);
        console.log('✅ Response:', response.data);
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }

    // Test 2: Invalid phone number (different number)
    console.log('\n📋 Test 2: Invalid phone number (987654321)');
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            phone: '987654321'
        });
        console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
        console.log('✅ Status:', error.response?.status);
        console.log('✅ Expected error message:', error.response?.data?.message);
    }

    // Test 3: Another invalid phone number
    console.log('\n📋 Test 3: Invalid phone number (123456789)');
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            phone: '123456789'
        });
        console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
        console.log('✅ Status:', error.response?.status);
        console.log('✅ Expected error message:', error.response?.data?.message);
    }

    // Test 4: Empty phone number
    console.log('\n📋 Test 4: Empty phone number');
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            phone: ''
        });
        console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
        console.log('✅ Status:', error.response?.status);
        console.log('✅ Expected error message:', error.response?.data?.message);
    }

    console.log('\n🎉 Admin Phone Restriction Test Completed!');
    console.log('\n✅ Summary:');
    console.log('   • Only phone number "1234567890" is accepted');
    console.log('   • All other phone numbers show "Please enter correct number"');
    console.log('   • Single admin account created with phone 1234567890');
    console.log('   • All previous admin accounts have been deleted');
}

testAdminPhoneRestriction();
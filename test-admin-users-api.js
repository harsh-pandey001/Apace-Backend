const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAdminUsersAPI() {
    console.log('🔍 Testing Admin Users API...\n');

    try {
        // Step 1: Test with the provided token (role: user)
        console.log('📋 Step 1: Testing with USER token (should fail)');
        const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY2ZDlmZGQ2LWY0NTYtNDYxYS05Yzc5LTZjYTFhMzFmYTczYiIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzUxOTc1NzIzLCJleHAiOjE3NTE5OTczMjN9.rkOHwu5KgLH5nwdvvWoeCs_bslP-fv6kQYAaw9BLXdw';
        
        try {
            const userResponse = await axios.get(`${BASE_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ UNEXPECTED: User token was accepted');
            console.log('Response:', userResponse.data);
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ EXPECTED: User token correctly rejected (403 Forbidden)');
                console.log('Message:', error.response.data.message);
            } else {
                console.log('❌ UNEXPECTED ERROR:', error.response?.data || error.message);
            }
        }

        console.log('\n📋 Step 2: Trying to get admin token...');
        
        // Step 2: Try to get admin token
        // First, let's try admin login (check if admin exists)
        try {
            // Request OTP for admin phone
            const otpResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
                phone: '+1234567890' // Default admin phone from seeder
            });
            console.log('✅ OTP requested for admin phone');
            
            // For testing, we'll use a dummy OTP (123456) 
            // In production, you'd get this from SMS/email
            const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
                phone: '+1234567890',
                otp: '123456'
            });
            
            if (verifyResponse.data.data.user.role === 'admin') {
                const adminToken = verifyResponse.data.data.token;
                console.log('✅ Admin token obtained');
                
                // Test with admin token
                console.log('\n📋 Step 3: Testing with ADMIN token');
                const adminResponse = await axios.get(`${BASE_URL}/api/users`, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('✅ SUCCESS: Admin API call successful');
                console.log('Results:', adminResponse.data.results);
                console.log('Total Users:', adminResponse.data.data.summary.totalUsers);
                console.log('Total Drivers:', adminResponse.data.data.summary.totalDrivers);
                console.log('Total All:', adminResponse.data.data.summary.totalAll);
                
                console.log('\nFirst few users:');
                adminResponse.data.data.users.slice(0, 3).forEach((user, index) => {
                    console.log(`${index + 1}. ${user.firstName || user.name} (${user.userType}) - ${user.email || user.phone}`);
                });
                
            } else {
                console.log('❌ Token is not for admin user');
            }
            
        } catch (error) {
            console.log('⚠️  Could not authenticate as admin:');
            console.log('Error:', error.response?.data?.message || error.message);
            console.log('\n💡 To test admin functionality:');
            console.log('1. Make sure admin user exists in database (run seeders)');
            console.log('2. Use correct admin phone number and OTP');
            console.log('3. Or create an admin user manually');
        }

        console.log('\n📋 Step 4: Show token analysis');
        // Decode the provided token to show what's inside
        const tokenParts = userToken.split('.');
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('Provided token payload:', JSON.stringify(payload, null, 2));
        
        console.log('\n🔧 SOLUTION:');
        console.log('The API is working correctly but requires admin role.');
        console.log('Your token has role: "user" but endpoint requires role: "admin"');
        console.log('To fix: Use a token with admin role or modify role restrictions.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testAdminUsersAPI();
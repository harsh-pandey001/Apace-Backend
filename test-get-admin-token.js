const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function getAdminToken() {
    console.log('🔍 Getting Admin Token...\n');

    try {
        // Step 1: Request OTP for admin
        console.log('📋 Step 1: Requesting OTP for admin phone (1234567890)');
        
        const otpResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            phone: '1234567890'
        });
        
        console.log('✅ OTP Response Status:', otpResponse.status);
        console.log('✅ OTP requested successfully');
        
        // Step 2: Verify OTP (in development, OTP is usually 123456)
        console.log('\n📋 Step 2: Verifying OTP (using default development OTP: 123456)');
        
        const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
            phone: '1234567890',
            otp: '123456'
        });
        
        console.log('✅ Verify Response Status:', verifyResponse.status);
        console.log('✅ User Role:', verifyResponse.data.data.user.role);
        console.log('✅ User Email:', verifyResponse.data.data.user.email);
        
        if (verifyResponse.data.data.user.role === 'admin') {
            const adminToken = verifyResponse.data.token;
            console.log('\n🎉 ADMIN TOKEN OBTAINED:');
            console.log(adminToken);
            
            // Step 3: Test the admin token with users API
            console.log('\n📋 Step 3: Testing admin token with /api/users');
            
            const usersResponse = await axios.get(`${BASE_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ SUCCESS! Admin API call successful');
            console.log('Results:', usersResponse.data.results);
            console.log('Total Users:', usersResponse.data.data.summary?.totalUsers || 'N/A');
            console.log('Total Drivers:', usersResponse.data.data.summary?.totalDrivers || 'N/A');
            console.log('Total All:', usersResponse.data.data.summary?.totalAll || usersResponse.data.totalUsers);
            
            console.log('\n📝 CURL COMMAND FOR TESTING:');
            console.log(`curl --location 'http://localhost:5000/api/users' \\`);
            console.log(`--header 'Authorization: Bearer ${adminToken}'`);
            
        } else {
            console.log('❌ ERROR: User is not admin');
            console.log('User role:', verifyResponse.data.data.user.role);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        
        if (error.response?.status === 400) {
            console.log('\n💡 TROUBLESHOOTING:');
            console.log('1. Make sure admin seeder ran successfully');
            console.log('2. Check if admin exists in admins table');
            console.log('3. OTP might be incorrect or expired');
        }
    }
}

// Run the function
getAdminToken();
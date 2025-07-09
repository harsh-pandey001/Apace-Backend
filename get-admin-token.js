const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function getAdminToken() {
    try {
        console.log('🔑 Getting Admin Token...\n');

        // Step 1: Request OTP for admin
        console.log('📞 Requesting OTP for admin (phone: 1234567890)...');
        
        await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            phone: '1234567890'
        });
        
        console.log('✅ OTP sent successfully');
        
        // Step 2: Verify OTP and get token
        console.log('🔓 Verifying OTP (using development OTP: 123456)...');
        
        const response = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
            phone: '1234567890',
            otp: '123456'
        });
        
        const { token, data } = response.data;
        
        console.log('✅ Authentication successful!');
        console.log('👤 Admin Details:');
        console.log(`   Name: ${data.user.firstName} ${data.user.lastName}`);
        console.log(`   Email: ${data.user.email}`);
        console.log(`   Role: ${data.user.role}`);
        
        console.log('\n🎫 ADMIN TOKEN:');
        console.log('================================================');
        console.log(token);
        console.log('================================================');
        
        console.log('\n📋 USAGE INSTRUCTIONS:');
        console.log('1. Copy the token above');
        console.log('2. Use it in your admin panel frontend');
        console.log('3. Set Authorization header: Bearer <token>');
        
        console.log('\n🧪 TEST COMMANDS:');
        console.log(`curl -H "Authorization: Bearer ${token}" ${BASE_URL}/api/users`);
        console.log(`curl -H "Authorization: Bearer ${token}" ${BASE_URL}/api/shipments/admin`);
        
        return token;
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            console.log('\n💡 Solution: Run the admin creation script:');
            console.log('node create-admin-manually.js');
        }
    }
}

// Self-executing function
(async () => {
    await getAdminToken();
    process.exit(0);
})();
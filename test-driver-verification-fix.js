const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const VERIFIED_DRIVER_ID = '0c8050ab-938e-4e3e-87eb-f37bce369b00';

// Admin login and get token
async function loginAdmin() {
    try {
        // Step 1: Request OTP
        const otpResponse = await axios.post(`${BASE_URL}/api/auth/request-otp`, {
            phone: '1234567890'
        });
        console.log('✅ OTP requested successfully');
        
        // Step 2: Verify OTP
        const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
            phone: '1234567890',
            otp: '123456'
        });
        
        console.log('✅ OTP verified successfully');
        return verifyResponse.data.token;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        throw error;
    }
}

async function testDriverVerificationFix() {
    console.log('🔍 Testing Driver Verification Status Fix...\n');

    try {
        // Step 1: Login as admin
        console.log('📋 Step 1: Admin login');
        const adminToken = await loginAdmin();
        
        // Step 2: Test individual driver details
        console.log('\n📋 Step 2: Testing individual driver details');
        const driverResponse = await axios.get(`${BASE_URL}/api/users/${VERIFIED_DRIVER_ID}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        console.log('✅ Driver Details Response:');
        console.log('   Driver ID:', driverResponse.data.data.user.id);
        console.log('   Driver Name:', driverResponse.data.data.user.firstName, driverResponse.data.data.user.lastName);
        console.log('   Is Verified:', driverResponse.data.data.user.isVerified);
        console.log('   Document Status:', driverResponse.data.data.user.documentVerificationStatus || 'Not included');
        
        // Step 3: Test driver document endpoint directly
        console.log('\n📋 Step 3: Testing driver document endpoint directly');
        const docResponse = await axios.get(`${BASE_URL}/api/driver-documents/my`, {
            headers: { 'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBjODA1MGFiLTkzOGUtNGUzZS04N2ViLWYzN2JjZTM2OWIwMCIsInJvbGUiOiJkcml2ZXIiLCJpYXQiOjE3NTIwNDU5MzcsImV4cCI6MTc1MjA2NzUzN30.cD6JWlKaRy4INyHl_1g9ZG-bB7FyTMGq91rsZXWI_fI` }
        });
        
        console.log('✅ Document Status:', docResponse.data.data.status);
        console.log('   Driver Name:', docResponse.data.data.driver.name);
        console.log('   Verified At:', docResponse.data.data.updated_at);
        
        // Step 4: Test getAllUsers to see if it shows correct status
        console.log('\n📋 Step 4: Testing getAllUsers endpoint');
        const allUsersResponse = await axios.get(`${BASE_URL}/api/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const targetDriver = allUsersResponse.data.data.users.find(user => user.id === VERIFIED_DRIVER_ID);
        if (targetDriver) {
            console.log('✅ Driver found in getAllUsers:');
            console.log('   Driver Name:', targetDriver.firstName, targetDriver.lastName);
            console.log('   Role:', targetDriver.role);
            console.log('   Is Verified:', targetDriver.isVerified);
            console.log('   Document Status:', targetDriver.documentVerificationStatus || 'Not included');
        } else {
            console.log('❌ Driver not found in getAllUsers response');
        }
        
        // Step 5: Summary
        console.log('\n🎉 Driver Verification Fix Testing Completed!');
        console.log('\n✅ Results Summary:');
        console.log('   • Individual driver API shows isVerified:', driverResponse.data.data.user.isVerified);
        console.log('   • Document endpoint shows status:', docResponse.data.data.status);
        console.log('   • getAllUsers API shows isVerified:', targetDriver?.isVerified);
        console.log('   • Admin panel should now show correct verification status');
        
        // Determine if fix was successful
        const isFixed = driverResponse.data.data.user.isVerified && 
                       docResponse.data.data.status === 'verified' && 
                       targetDriver?.isVerified;
        
        if (isFixed) {
            console.log('\n🟢 FIX SUCCESSFUL: Driver verification status is correctly synchronized!');
        } else {
            console.log('\n🔴 FIX INCOMPLETE: Some APIs still showing incorrect status');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testDriverVerificationFix();
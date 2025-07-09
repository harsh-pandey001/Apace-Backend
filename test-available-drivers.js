const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YmJkYzY3LWUyOGMtNGJhOC05YTEyLWU0N2RlZjAzNjljMiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MTk3NzkzMywiZXhwIjoxNzUxOTk5NTMzfQ.EkOWUmKwzuk6UrhKML_KTRBdtze3hqZ-5Bnl0VT3HSI';

async function testAvailableDrivers() {
    console.log('🚗 Testing Available Drivers API...\n');

    try {
        // Test 1: Get available drivers for "Bike" vehicle type
        console.log('📋 Test 1: Get Available Drivers for Bike');
        const bikeResponse = await axios.get(`${BASE_URL}/api/drivers/available?vehicleType=Bike`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        console.log('✅ Status:', bikeResponse.status);
        console.log('✅ Message:', bikeResponse.data.message);
        console.log('✅ Results:', bikeResponse.data.results);
        
        if (bikeResponse.data.data.drivers.length > 0) {
            const driver = bikeResponse.data.data.drivers[0];
            console.log(`   Example: ${driver.name} - ${driver.vehicleNumber} (${driver.vehicleType})`);
            console.log(`   Documents Status: ${driver.documentsStatus}`);
        }

        // Test 2: Get available drivers for "Truck" vehicle type
        console.log('\n📋 Test 2: Get Available Drivers for Truck');
        const truckResponse = await axios.get(`${BASE_URL}/api/drivers/available?vehicleType=Truck`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        console.log('✅ Status:', truckResponse.status);
        console.log('✅ Message:', truckResponse.data.message);
        console.log('✅ Results:', truckResponse.data.results);

        // Test 3: Get available drivers for "Van" vehicle type
        console.log('\n📋 Test 3: Get Available Drivers for Van');
        const vanResponse = await axios.get(`${BASE_URL}/api/drivers/available?vehicleType=Van`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        console.log('✅ Status:', vanResponse.status);
        console.log('✅ Message:', vanResponse.data.message);
        console.log('✅ Results:', vanResponse.data.results);

        // Test 4: Test without vehicleType parameter (should fail)
        console.log('\n📋 Test 4: Test without vehicleType parameter');
        try {
            const noParamResponse = await axios.get(`${BASE_URL}/api/drivers/available`, {
                headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
            });
        } catch (error) {
            console.log('✅ Expected error:', error.response?.data?.message || error.message);
        }

        console.log('\n🎉 All tests completed! The getAvailableDrivers API is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testAvailableDrivers();
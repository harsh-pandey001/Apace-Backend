const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YmJkYzY3LWUyOGMtNGJhOC05YTEyLWU0N2RlZjAzNjljMiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MTk3NzkzMywiZXhwIjoxNzUxOTk5NTMzfQ.EkOWUmKwzuk6UrhKML_KTRBdtze3hqZ-5Bnl0VT3HSI';

async function testAdminVehicles() {
    console.log('🚗 Testing Admin Vehicles API...\n');

    try {
        // Test 1: Get available vehicles
        console.log('📋 Test 1: Get Available Vehicles');
        const availableResponse = await axios.get(`${BASE_URL}/api/admin/vehicles/available`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        console.log('✅ Status:', availableResponse.status);
        console.log('✅ Available Vehicles:', availableResponse.data.results);
        
        if (availableResponse.data.data.vehicles.length > 0) {
            const vehicle = availableResponse.data.data.vehicles[0];
            console.log(`   Example: ${vehicle.vehicleNumber} - ${vehicle.model} (${vehicle.type})`);
        }

        // Test 2: Get all vehicles
        console.log('\n📋 Test 2: Get All Vehicles');
        const allResponse = await axios.get(`${BASE_URL}/api/admin/vehicles`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        console.log('✅ Status:', allResponse.status);
        console.log('✅ Total Vehicles:', allResponse.data.totalVehicles);
        console.log('✅ Results on Page:', allResponse.data.results);

        console.log('\n🎉 All tests passed! The vehicleService.getAvailableVehicles function should work now.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testAdminVehicles();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE2MzgyZGU5LTVjOGMtMTFmMC1iMGEyLTAyNDJhYzEzMDAwMiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MjA1ODQ0MCwiZXhwIjoxNzUyMDgwMDQwfQ.ata7NNO9Oki6DpMVeoDNigUtz55QCj17Snaj3i5w03k';

async function testShipmentAssignment() {
    console.log('🚢 Testing Shipment Assignment...\n');
    
    const shipmentId = '3120f9da-1301-4710-9f61-c151573556f4';
    const driverId = 'ea4c4a6c-09fb-43e7-98af-2c873a6e75d2';
    
    try {
        // Test 1: Get shipment details
        console.log('📋 Step 1: Get shipment details...');
        const shipmentResponse = await axios.get(`${BASE_URL}/api/shipments/admin/${shipmentId}`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        console.log('✅ Shipment found:');
        console.log(`   - ID: ${shipmentResponse.data.data.shipment.id}`);
        console.log(`   - Tracking: ${shipmentResponse.data.data.shipment.trackingNumber}`);
        console.log(`   - Vehicle Type: ${shipmentResponse.data.data.shipment.vehicleType}`);
        console.log(`   - Status: ${shipmentResponse.data.data.shipment.status}`);
        console.log(`   - Current Vehicle ID: ${shipmentResponse.data.data.shipment.vehicleId}`);
        
        // Test 2: Get driver details
        console.log('\n📋 Step 2: Get driver details...');
        const driverResponse = await axios.get(`${BASE_URL}/api/drivers/${driverId}`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        console.log('✅ Driver found:');
        console.log(`   - ID: ${driverResponse.data.data.driver.id}`);
        console.log(`   - Name: ${driverResponse.data.data.driver.name}`);
        console.log(`   - Vehicle Type: ${driverResponse.data.data.driver.vehicleType}`);
        console.log(`   - Vehicle Number: ${driverResponse.data.data.driver.vehicleNumber}`);
        console.log(`   - Is Active: ${driverResponse.data.data.driver.isActive}`);
        console.log(`   - Is Verified: ${driverResponse.data.data.driver.isVerified}`);
        
        // Test 3: Attempt assignment
        console.log('\n📋 Step 3: Attempting assignment...');
        const assignmentData = {
            driverId: driverId,
            estimatedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            notes: 'Test assignment'
        };
        
        console.log('Assignment data:', assignmentData);
        
        const assignmentResponse = await axios.patch(
            `${BASE_URL}/api/shipments/admin/assign/${shipmentId}`,
            assignmentData,
            {
                headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
            }
        );
        
        console.log('✅ Assignment successful!');
        console.log(`   - Status: ${assignmentResponse.data.status}`);
        console.log(`   - Message: ${assignmentResponse.data.message}`);
        console.log(`   - Assigned Driver: ${assignmentResponse.data.data.assignedDriver.name}`);
        console.log(`   - Vehicle Number: ${assignmentResponse.data.data.assignedDriver.vehicleNumber}`);
        
        console.log('\n🎉 SUCCESS: Shipment assignment is working correctly!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        
        if (error.response?.data?.errors) {
            console.error('Validation errors:', error.response.data.errors);
        }
    }
}

testShipmentAssignment();
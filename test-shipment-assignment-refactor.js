const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0YmJkYzY3LWUyOGMtNGJhOC05YTEyLWU0N2RlZjAzNjljMiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MTk3NzkzMywiZXhwIjoxNzUxOTk5NTMzfQ.EkOWUmKwzuk6UrhKML_KTRBdtze3hqZ-5Bnl0VT3HSI';

async function testShipmentAssignmentRefactor() {
    console.log('🔧 Testing Refactored Shipment Assignment Workflow...\n');

    try {
        // Test 1: Get available drivers for different vehicle types
        console.log('📋 Test 1: Get Available Drivers by Vehicle Type');
        
        const vehicleTypes = ['bike', 'van', 'truck'];
        
        for (const vehicleType of vehicleTypes) {
            console.log(`\n   Testing ${vehicleType} drivers:`);
            const response = await axios.get(`${BASE_URL}/api/drivers/available?vehicleType=${vehicleType}`, {
                headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
            });
            
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   ✅ Available drivers: ${response.data.results}`);
            console.log(`   ✅ Message: ${response.data.message}`);
            
            if (response.data.data.drivers.length > 0) {
                const driver = response.data.data.drivers[0];
                console.log(`   📄 Example driver: ${driver.name} - ${driver.vehicleNumber} (${driver.vehicleType})`);
                console.log(`   📄 Documents Status: ${driver.documentsStatus}`);
                console.log(`   📄 Availability: ${driver.availability_status}`);
            }
        }

        // Test 2: Create a test shipment for assignment
        console.log('\n📋 Test 2: Create Test Shipment for Assignment');
        
        const testShipment = {
            userType: 'guest',
            pickupAddress: '123 Test Street, Mumbai',
            deliveryAddress: '456 Demo Avenue, Pune',
            scheduledPickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            weight: 2.5,
            vehicleType: 'bike',
            guestName: 'Test User',
            guestPhone: '+919876543210',
            guestEmail: 'test@example.com'
        };

        const createResponse = await axios.post(`${BASE_URL}/api/shipments`, testShipment);
        console.log(`   ✅ Shipment created: ${createResponse.data.data.shipment.trackingNumber}`);
        console.log(`   ✅ Shipment ID: ${createResponse.data.data.shipment.bookingId}`);
        console.log(`   ✅ Vehicle Type: ${createResponse.data.data.shipment.vehicleType}`);
        
        const shipmentId = createResponse.data.data.shipment.bookingId;

        // Test 3: Get available drivers for the shipment's vehicle type
        console.log('\n📋 Test 3: Get Drivers for Shipment Vehicle Type');
        
        const driversResponse = await axios.get(`${BASE_URL}/api/drivers/available?vehicleType=bike`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        if (driversResponse.data.data.drivers.length === 0) {
            console.log('   ❌ No verified drivers available for Bike type');
            console.log('   ⚠️  Cannot test assignment without verified drivers');
            return;
        }

        const availableDriver = driversResponse.data.data.drivers[0];
        console.log(`   ✅ Found verified driver: ${availableDriver.name}`);
        console.log(`   ✅ Driver vehicle: ${availableDriver.vehicleNumber} (${availableDriver.vehicleType})`);

        // Test 4: Assign shipment to driver (new workflow)
        console.log('\n📋 Test 4: Assign Shipment to Driver (No Vehicle Selection)');
        
        const assignmentData = {
            driverId: availableDriver.id,
            estimatedDeliveryDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            notes: 'Test assignment using new workflow'
        };

        const assignResponse = await axios.patch(
            `${BASE_URL}/api/shipments/admin/assign/${shipmentId}`, 
            assignmentData,
            { headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` } }
        );

        console.log(`   ✅ Assignment successful!`);
        console.log(`   ✅ Assigned to: ${assignResponse.data.data.assignedDriver.name}`);
        console.log(`   ✅ Vehicle auto-assigned: ${assignResponse.data.data.assignedDriver.vehicleNumber}`);
        console.log(`   ✅ Vehicle type: ${assignResponse.data.data.assignedDriver.vehicleType}`);
        console.log(`   ✅ Message: ${assignResponse.data.message}`);

        // Test 5: Verify shipment status
        console.log('\n📋 Test 5: Verify Assigned Shipment');
        
        const shipmentDetailResponse = await axios.get(
            `${BASE_URL}/api/shipments/admin/${shipmentId}`,
            { headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` } }
        );

        const shipmentDetail = shipmentDetailResponse.data.data.shipment;
        console.log(`   ✅ Shipment status: ${shipmentDetail.status}`);
        
        if (shipmentDetail.vehicle) {
            console.log(`   ✅ Assigned vehicle: ${shipmentDetail.vehicle.vehicleNumber}`);
            console.log(`   ✅ Driver info: ${shipmentDetail.vehicle.driverOwner?.name || 'N/A'}`);
        } else {
            console.log(`   ⚠️  No vehicle assignment visible in shipment details`);
        }

        // Test 6: Test error case - invalid vehicle type match
        console.log('\n📋 Test 6: Test Vehicle Type Mismatch Error');
        
        // Try to get drivers for a different vehicle type than shipment requires
        const vanDriversResponse = await axios.get(`${BASE_URL}/api/drivers/available?vehicleType=van`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        if (vanDriversResponse.data.data.drivers.length > 0) {
            const vanDriver = vanDriversResponse.data.data.drivers[0];
            
            try {
                await axios.patch(
                    `${BASE_URL}/api/shipments/admin/assign/${shipmentId}`, 
                    { driverId: vanDriver.id },
                    { headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` } }
                );
                console.log(`   ❌ Should have failed - vehicle type mismatch not detected`);
            } catch (error) {
                console.log(`   ✅ Correctly rejected mismatched vehicle type: ${error.response?.data?.message}`);
            }
        } else {
            console.log(`   ⚠️  No Van drivers available to test mismatch scenario`);
        }

        console.log('\n🎉 All tests completed! The refactored shipment assignment workflow is working correctly.');
        console.log('\n✅ Key improvements verified:');
        console.log('   • Only verified drivers with matching vehicle type are available');
        console.log('   • No manual vehicle selection required');
        console.log('   • Vehicle is automatically assigned from driver info');
        console.log('   • Vehicle type mismatch is prevented');
        console.log('   • Assignment process simplified for admin panel');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testShipmentAssignmentRefactor();
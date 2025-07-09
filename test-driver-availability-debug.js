const axios = require('axios');
const { Driver, DriverDocument } = require('./models');

const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE2MzgyZGU5LTVjOGMtMTFmMC1iMGEyLTAyNDJhYzEzMDAwMiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MjA1ODA2MCwiZXhwIjoxNzUyMDc5NjYwfQ.nctshPS3LXkqW5vfHiVy6Bx6ZbQw396hvxbRfWxFNrw';

async function debugDriverAvailability() {
    console.log('🔍 Debugging Driver Availability for ea4c4a6c-09fb-43e7-98af-2c873a6e75d2...\n');

    const targetDriverId = 'ea4c4a6c-09fb-43e7-98af-2c873a6e75d2';
    
    try {
        // 1. Check driver exists and details
        console.log('📋 Step 1: Checking driver details...');
        const driver = await Driver.findByPk(targetDriverId);
        
        if (!driver) {
            console.log('❌ Driver not found in database');
            return;
        }
        
        console.log('✅ Driver found:');
        console.log(`   - Name: ${driver.name}`);
        console.log(`   - Email: ${driver.email}`);
        console.log(`   - Phone: ${driver.phone}`);
        console.log(`   - Vehicle Type: ${driver.vehicleType}`);
        console.log(`   - Vehicle Number: ${driver.vehicleNumber}`);
        console.log(`   - Availability Status: ${driver.availability_status}`);
        console.log(`   - Is Active: ${driver.isActive}`);
        console.log(`   - Is Verified: ${driver.isVerified}`);
        
        // 2. Check driver documents
        console.log('\n📋 Step 2: Checking driver documents...');
        const documents = await DriverDocument.findAll({
            where: { driver_id: targetDriverId }
        });
        
        if (documents.length === 0) {
            console.log('❌ No documents found for this driver');
        } else {
            console.log(`✅ Found ${documents.length} documents:`);
            documents.forEach((doc, index) => {
                console.log(`   Document ${index + 1}:`);
                console.log(`     - Type: ${doc.document_type}`);
                console.log(`     - Status: ${doc.status}`);
                console.log(`     - File Path: ${doc.file_path}`);
                console.log(`     - Created: ${doc.createdAt}`);
                console.log(`     - Updated: ${doc.updatedAt}`);
            });
        }
        
        // 3. Check if driver meets filtering criteria
        console.log('\n📋 Step 3: Checking filtering criteria...');
        
        const hasVerifiedDocs = documents.some(doc => doc.status === 'verified');
        const meetsBasicCriteria = driver.isActive && driver.availability_status === 'online';
        
        console.log(`   - Has verified documents: ${hasVerifiedDocs}`);
        console.log(`   - Meets basic criteria (active + online): ${meetsBasicCriteria}`);
        
        // 4. Test API calls for different vehicle types
        console.log('\n📋 Step 4: Testing API calls...');
        
        const vehicleTypes = ['bike', 'Bike', 'truck', 'Truck', 'van', 'Van', driver.vehicleType];
        const uniqueVehicleTypes = [...new Set(vehicleTypes)];
        
        for (const vehicleType of uniqueVehicleTypes) {
            console.log(`\n   Testing vehicleType: "${vehicleType}"`);
            try {
                const response = await axios.get(`${BASE_URL}/api/drivers/available?vehicleType=${vehicleType}`, {
                    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
                });
                
                const foundDriver = response.data.data.drivers.find(d => d.id === targetDriverId);
                console.log(`   - API Response: ${response.data.results} drivers found`);
                console.log(`   - Target driver in results: ${foundDriver ? 'YES' : 'NO'}`);
                
                if (foundDriver) {
                    console.log(`   - Driver details: ${foundDriver.name} (${foundDriver.vehicleType})`);
                }
                
            } catch (error) {
                console.log(`   - API Error: ${error.response?.data?.message || error.message}`);
            }
        }
        
        // 5. Test with shipment APACE-57541441-5996
        console.log('\n📋 Step 5: Testing with specific shipment...');
        
        try {
            // First, get shipment details
            const shipmentResponse = await axios.get(`${BASE_URL}/api/shipments/APACE-57541441-5996`, {
                headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
            });
            
            console.log('   Shipment found:');
            console.log(`   - Tracking: ${shipmentResponse.data.data.shipment.trackingNumber}`);
            console.log(`   - Vehicle Type: ${shipmentResponse.data.data.shipment.vehicleType}`);
            console.log(`   - Status: ${shipmentResponse.data.data.shipment.status}`);
            
            // Test API with shipment's vehicle type
            const shipmentVehicleType = shipmentResponse.data.data.shipment.vehicleType;
            console.log(`\n   Testing with shipment vehicleType: "${shipmentVehicleType}"`);
            
            const availableResponse = await axios.get(`${BASE_URL}/api/drivers/available?vehicleType=${shipmentVehicleType}`, {
                headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
            });
            
            const foundInShipmentSearch = availableResponse.data.data.drivers.find(d => d.id === targetDriverId);
            console.log(`   - Driver found for shipment vehicle type: ${foundInShipmentSearch ? 'YES' : 'NO'}`);
            
        } catch (error) {
            console.log(`   - Shipment API Error: ${error.response?.data?.message || error.message}`);
        }
        
        console.log('\n🎉 Debug analysis complete!');
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.error(error.stack);
    }
}

// Run the debug function
debugDriverAvailability();
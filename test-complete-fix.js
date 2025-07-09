const axios = require('axios');
const { Driver, DriverDocument, VehicleType } = require('./models');
const { Op } = require('sequelize');

const BASE_URL = 'http://localhost:5000';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE2MzgyZGU5LTVjOGMtMTFmMC1iMGEyLTAyNDJhYzEzMDAwMiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MjA1ODQ0MCwiZXhwIjoxNzUyMDgwMDQwfQ.ata7NNO9Oki6DpMVeoDNigUtz55QCj17Snaj3i5w03k';

async function testCompleteFix() {
    console.log('🔍 Testing Complete Fix for Driver Availability...\n');

    const targetDriverId = 'ea4c4a6c-09fb-43e7-98af-2c873a6e75d2';
    
    try {
        // 1. Verify driver details
        console.log('📋 Step 1: Verifying driver details...');
        const driver = await Driver.findByPk(targetDriverId);
        
        if (!driver) {
            console.log('❌ Driver not found');
            return;
        }
        
        console.log(`✅ Driver found: ${driver.name}`);
        console.log(`   - Vehicle Type: ${driver.vehicleType}`);
        console.log(`   - Status: ${driver.availability_status}`);
        console.log(`   - Active: ${driver.isActive}`);
        console.log(`   - Verified: ${driver.isVerified}`);
        
        // 2. Check documents
        console.log('\n📋 Step 2: Checking documents...');
        const documents = await DriverDocument.findAll({
            where: { driver_id: targetDriverId }
        });
        
        if (documents.length === 0) {
            console.log('❌ No documents found');
            return;
        }
        
        const verifiedDocs = documents.filter(doc => doc.status === 'verified');
        console.log(`✅ Found ${documents.length} documents, ${verifiedDocs.length} verified`);
        
        // 3. Check vehicle type mapping
        console.log('\n📋 Step 3: Checking vehicle type mapping...');
        const vehicleTypeMapping = await VehicleType.findOne({
            where: {
                [Op.or]: [
                    { vehicleType: 'mini_truck' },
                    { label: 'mini_truck' }
                ]
            }
        });
        
        if (vehicleTypeMapping) {
            console.log(`✅ Vehicle type mapping found:`);
            console.log(`   - VehicleType: ${vehicleTypeMapping.vehicleType}`);
            console.log(`   - Label: ${vehicleTypeMapping.label}`);
        } else {
            console.log('❌ No vehicle type mapping found');
        }
        
        // 4. Test the direct search logic
        console.log('\n📋 Step 4: Testing direct search logic...');
        
        const searchTerms = vehicleTypeMapping ? 
            [vehicleTypeMapping.vehicleType, vehicleTypeMapping.label] : 
            ['mini_truck'];
        
        console.log(`   Search terms: ${searchTerms.join(', ')}`);
        
        const { sequelize } = require('./models');
        
        const matchingDrivers = await Driver.findAll({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: searchTerms.map(term => 
                            sequelize.where(
                                sequelize.fn('LOWER', sequelize.col('vehicleType')),
                                sequelize.fn('LOWER', term)
                            )
                        )
                    },
                    { isActive: true },
                    { availability_status: 'online' }
                ]
            },
            include: [
                {
                    model: DriverDocument,
                    as: 'documents',
                    required: false
                }
            ]
        });
        
        console.log(`   Found ${matchingDrivers.length} drivers matching basic criteria`);
        
        const verifiedDrivers = matchingDrivers.filter(driver => {
            console.log(`      Checking driver ${driver.name}: documents type = ${typeof driver.documents}`);
            if (Array.isArray(driver.documents)) {
                const hasVerifiedDocs = driver.documents.some(doc => doc.status === 'verified');
                console.log(`        Has verified docs: ${hasVerifiedDocs}`);
                return hasVerifiedDocs;
            } else if (driver.documents && driver.documents.status === 'verified') {
                console.log(`        Single document is verified`);
                return true;
            }
            console.log(`        No verified documents found`);
            return false;
        });
        
        console.log(`   Found ${verifiedDrivers.length} drivers with verified documents`);
        
        const targetDriverFound = verifiedDrivers.find(d => d.id === targetDriverId);
        console.log(`   Target driver found: ${targetDriverFound ? 'YES' : 'NO'}`);
        
        // 5. Test the API
        console.log('\n📋 Step 5: Testing API...');
        
        const response = await axios.get(`${BASE_URL}/api/drivers/available?vehicleType=mini_truck`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        console.log(`   API Response: ${response.data.results} drivers found`);
        const apiDriverFound = response.data.data.drivers.find(d => d.id === targetDriverId);
        console.log(`   Target driver in API results: ${apiDriverFound ? 'YES' : 'NO'}`);
        
        // 6. Test with shipment assignment
        console.log('\n📋 Step 6: Testing shipment assignment...');
        
        const shipmentResponse = await axios.get(`${BASE_URL}/api/shipments/admin`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        const shipment = shipmentResponse.data.data.shipments[0];
        console.log(`   Shipment vehicle type: ${shipment.vehicleType}`);
        
        const assignmentResponse = await axios.get(`${BASE_URL}/api/drivers/available?vehicleType=${shipment.vehicleType}`, {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
        });
        
        console.log(`   Available drivers for shipment: ${assignmentResponse.data.results}`);
        const canAssign = assignmentResponse.data.data.drivers.find(d => d.id === targetDriverId);
        console.log(`   Can assign target driver: ${canAssign ? 'YES' : 'NO'}`);
        
        if (canAssign) {
            console.log('\n🎉 SUCCESS: Driver assignment issue is fixed!');
        } else {
            console.log('\n❌ ISSUE: Driver still not available for assignment');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testCompleteFix();
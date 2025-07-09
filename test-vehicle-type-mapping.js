const { VehicleType } = require('./models');
const { Op } = require('sequelize');

async function testVehicleTypeMapping() {
    console.log('🔍 Testing Vehicle Type Mapping...\n');
    
    try {
        // Test 1: Get all vehicle types
        console.log('📋 Step 1: Get all vehicle types...');
        const allVehicleTypes = await VehicleType.findAll();
        console.log(`Found ${allVehicleTypes.length} vehicle types:`);
        allVehicleTypes.forEach(vt => {
            console.log(`  - VehicleType: ${vt.vehicleType}, Label: ${vt.label}`);
        });
        
        // Test 2: Test specific mapping for mini_truck
        console.log('\n📋 Step 2: Test mapping for mini_truck...');
        const miniTruckMapping = await VehicleType.findOne({
            where: {
                [Op.or]: [
                    { vehicleType: 'mini_truck' },
                    { label: 'mini_truck' }
                ]
            }
        });
        
        if (miniTruckMapping) {
            console.log(`✅ Mini truck mapping found: vehicleType="${miniTruckMapping.vehicleType}", label="${miniTruckMapping.label}"`);
        } else {
            console.log('❌ No mini truck mapping found');
        }
        
        // Test 3: Test mapping for Pickup
        console.log('\n📋 Step 3: Test mapping for Pickup...');
        const pickupMapping = await VehicleType.findOne({
            where: {
                [Op.or]: [
                    { vehicleType: 'Pickup' },
                    { label: 'Pickup' }
                ]
            }
        });
        
        if (pickupMapping) {
            console.log(`✅ Pickup mapping found: vehicleType="${pickupMapping.vehicleType}", label="${pickupMapping.label}"`);
        } else {
            console.log('❌ No Pickup mapping found');
        }
        
        console.log('\n🎉 Vehicle type mapping test complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

testVehicleTypeMapping();
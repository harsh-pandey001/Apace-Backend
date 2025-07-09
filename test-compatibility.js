const { VehicleType, sequelize } = require('./models');
const { Op } = require('sequelize');

async function testVehicleTypeCompatibility() {
    console.log('🔍 Testing Vehicle Type Compatibility...\n');
    
    const driverVehicleType = 'Pickup';
    const shipmentVehicleType = 'mini_truck';
    
    try {
        // Test 1: Direct comparison
        console.log('📋 Step 1: Direct comparison...');
        const directMatch = driverVehicleType.toLowerCase() === shipmentVehicleType.toLowerCase();
        console.log(`   Direct match: ${directMatch}`);
        
        // Test 2: Get vehicle type mapping
        console.log('\n📋 Step 2: Get vehicle type mapping...');
        const vehicleTypeMapping = await VehicleType.findOne({
            where: {
                [Op.or]: [
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('vehicleType')),
                        sequelize.fn('LOWER', shipmentVehicleType)
                    ),
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.col('label')),
                        sequelize.fn('LOWER', shipmentVehicleType)
                    )
                ]
            }
        });
        
        if (vehicleTypeMapping) {
            console.log('✅ Vehicle type mapping found:');
            console.log(`   - VehicleType: ${vehicleTypeMapping.vehicleType}`);
            console.log(`   - Label: ${vehicleTypeMapping.label}`);
            
            // Test 3: Check compatibility
            console.log('\n📋 Step 3: Check compatibility...');
            const typeMatch = driverVehicleType.toLowerCase() === vehicleTypeMapping.vehicleType.toLowerCase();
            const labelMatch = driverVehicleType.toLowerCase() === vehicleTypeMapping.label.toLowerCase();
            
            console.log(`   Driver vehicle type: ${driverVehicleType}`);
            console.log(`   Mapped vehicle type: ${vehicleTypeMapping.vehicleType}`);
            console.log(`   Mapped label: ${vehicleTypeMapping.label}`);
            console.log(`   Type match: ${typeMatch}`);
            console.log(`   Label match: ${labelMatch}`);
            
            const isCompatible = typeMatch || labelMatch;
            console.log(`   Is compatible: ${isCompatible}`);
            
            if (isCompatible) {
                console.log('\n🎉 SUCCESS: Vehicle types are compatible!');
            } else {
                console.log('\n❌ ISSUE: Vehicle types are not compatible');
            }
        } else {
            console.log('❌ No vehicle type mapping found');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

testVehicleTypeCompatibility();
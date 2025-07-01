const { VehicleType } = require('./models');

async function testIconKeyMigration() {
  try {
    console.log('🔄 Checking iconKey migration...');
    
    // Get all vehicle types to see if iconKey exists
    const vehicles = await VehicleType.findAll();
    
    console.log('📋 Current vehicles in database:');
    vehicles.forEach(vehicle => {
      console.log(`- ${vehicle.vehicleType}: ${vehicle.label} (iconKey: ${vehicle.iconKey || 'NOT SET'})`);
    });
    
    // Test creating a new vehicle with iconKey
    console.log('\n🔄 Testing new vehicle creation with iconKey...');
    const newVehicle = await VehicleType.create({
      vehicleType: 'test_icon_check',
      label: 'Icon Test Vehicle',
      capacity: 'Up to 100kg',
      basePrice: 25.00,
      pricePerKm: 3.00,
      startingPrice: 15.00,
      iconKey: 'bike'
    });
    
    console.log('✅ New vehicle created with iconKey:', newVehicle.iconKey);
    
    // Clean up
    await newVehicle.destroy();
    console.log('✅ Test vehicle cleaned up');
    
    console.log('\n🎉 IconKey functionality is working properly!');
    
  } catch (error) {
    console.error('❌ Error testing iconKey:', error.message);
  } finally {
    process.exit(0);
  }
}

testIconKeyMigration();
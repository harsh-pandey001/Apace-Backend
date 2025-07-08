const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const debugDriverShipments = async () => {
  console.log('🔍 Debug Driver Shipments Issue\n');
  console.log('================================\n');

  try {
    // Step 1: Login as driver
    console.log('1. Testing driver login...');
    let driverToken, driverData;
    
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/driver-auth/verify-otp`, {
        phone: "8989120990",
        otp: "123456"
      });
      
      driverToken = loginResponse.data.token;
      driverData = loginResponse.data.driver;
      console.log('✅ Driver login successful');
      console.log('   Driver ID:', driverData.id);
      console.log('   Driver Name:', driverData.name);
      
    } catch (error) {
      console.log('❌ Driver login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Step 2: Check if driver has any vehicles assigned
    console.log('\n2. Checking driver vehicles...');
    try {
      // Since we don't have a direct endpoint, we'll check the database logic
      // by trying to call the shipments endpoint and see the SQL query
      const shipmentsResponse = await axios.get(`${BASE_URL}/api/shipments/driver/assigned`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`
        }
      });
      console.log('✅ Driver shipments query worked');
      console.log('   Results:', shipmentsResponse.data.results);
      
    } catch (error) {
      console.log('❌ Driver shipments failed:', error.response?.data?.message || error.message);
      
      // Analyze the SQL query from error
      if (error.response?.data?.error?.sql) {
        const sql = error.response.data.error.sql;
        const vehicleIdMatch = sql.match(/WHERE `Shipment`\.`vehicleId` IN \(([^)]+)\)/);
        if (vehicleIdMatch) {
          const vehicleIds = vehicleIdMatch[1];
          console.log('   🔍 Driver vehicles found:', vehicleIds);
          if (vehicleIds === 'NULL') {
            console.log('   ❌ No vehicles assigned to this driver');
          }
        }
      }
    }

    // Step 3: Check if vehicles table has driverId column
    console.log('\n3. Understanding the issue...');
    console.log('   The error shows:');
    console.log('   - Driver ID:', driverData.id);
    console.log('   - Query looks for vehicles where driverId = driver.id');
    console.log('   - No vehicles found (vehicleIds = NULL)');
    console.log('   - This means either:');
    console.log('     a) No vehicles exist in database');
    console.log('     b) No vehicles assigned to this driver');
    console.log('     c) vehicles.driverId column doesn\'t exist or is NULL');

    // Step 4: Test vehicle creation or assignment
    console.log('\n4. Potential solutions:');
    console.log('   1. Create vehicles in database with driverId field');
    console.log('   2. Assign existing vehicles to drivers');
    console.log('   3. Check if vehicles.driverId column exists in database');
    console.log('   4. Update getDriverShipments to handle empty vehicle list gracefully');

    // Step 5: Test admin endpoints to check vehicles
    console.log('\n5. Testing vehicle endpoints...');
    try {
      const vehiclesResponse = await axios.get(`${BASE_URL}/api/vehicles`);
      console.log('✅ Vehicles endpoint accessible');
      console.log('   Vehicle types available:', vehiclesResponse.data.data?.length || 0);
      
    } catch (error) {
      console.log('❌ Vehicles endpoint failed:', error.response?.data?.message || error.message);
    }

    console.log('\n📋 DIAGNOSIS:');
    console.log('==============');
    console.log('The driver has no vehicles assigned to them.');
    console.log('The getDriverShipments logic is correct:');
    console.log('1. Find vehicles where driverId = driver.id');
    console.log('2. Find shipments where vehicleId IN (vehicle IDs)');
    console.log('');
    console.log('🔧 SOLUTIONS:');
    console.log('==============');
    console.log('1. Create vehicles with driverId field populated');
    console.log('2. Add admin endpoint to assign vehicles to drivers');
    console.log('3. Return empty array gracefully when no vehicles found');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
};

// Test server connectivity
const testServerConnectivity = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running at', BASE_URL);
    return true;
  } catch (error) {
    console.error('❌ Server not accessible at', BASE_URL);
    console.error('💡 Please start the server with: npm run dev');
    return false;
  }
};

// Run the debug
const runDebug = async () => {
  const serverRunning = await testServerConnectivity();
  if (!serverRunning) {
    return;
  }

  await debugDriverShipments();
};

runDebug();
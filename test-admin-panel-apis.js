const axios = require('axios');

const baseURL = 'http://localhost:5000/api';
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE2MzgyZGU5LTVjOGMtMTFmMC1iMGEyLTAyNDJhYzEzMDAwMiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MjA2MzE5NiwiZXhwIjoxNzUyMDg0Nzk2fQ.NRDYfVRBgZeGxAqgUZby4Wo12HEP5h5NH8eLFWYfufs';

const api = axios.create({
  baseURL,
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
});

async function testAdminPanelAPIs() {
  console.log('🔍 Testing Admin Panel APIs...\n');

  try {
    // Test Users API
    console.log('📋 Testing Users API (/api/users)...');
    const usersResponse = await api.get('/users');
    console.log(`✅ Users: ${usersResponse.data.results} users found`);
    console.log(`   Total users: ${usersResponse.data.totalUsers}`);
    console.log(`   Sample user: ${usersResponse.data.data.users[0]?.firstName} ${usersResponse.data.data.users[0]?.lastName}\n`);

    // Test Drivers API
    console.log('🚗 Testing Drivers API (/api/drivers/all)...');
    const driversResponse = await api.get('/drivers/all');
    console.log(`✅ Drivers: ${driversResponse.data.results} drivers found`);
    
    // Check driver data structure
    const firstDriver = driversResponse.data.data.drivers[0];
    console.log(`   Sample driver: ${firstDriver?.name}`);
    console.log(`   Vehicle Type: ${firstDriver?.vehicleType}`);
    console.log(`   Availability: ${firstDriver?.availability_status}`);
    console.log(`   Verified: ${firstDriver?.isVerified}`);
    console.log(`   Active: ${firstDriver?.isActive}\n`);

    // Test Vehicle Types API (public)
    console.log('🚚 Testing Vehicle Types API (/api/vehicles)...');
    const vehicleResponse = await axios.get('http://localhost:5000/api/vehicles');
    console.log(`✅ Vehicle Types: ${vehicleResponse.data.data.length} types found`);
    vehicleResponse.data.data.forEach(vehicle => {
      console.log(`   - ${vehicle.name} (${vehicle.type})`);
    });

    console.log('\n🎉 All Admin Panel APIs are working correctly!');
    
    // Test filtering scenarios
    console.log('\n🔍 Testing Driver Filtering Scenarios...');
    
    const drivers = driversResponse.data.data.drivers;
    
    // Verification status filter
    const verifiedDrivers = drivers.filter(d => d.isVerified === true);
    const unverifiedDrivers = drivers.filter(d => d.isVerified === false);
    console.log(`📊 Verification Status: ${verifiedDrivers.length} verified, ${unverifiedDrivers.length} unverified`);
    
    // Availability status filter
    const onlineDrivers = drivers.filter(d => d.availability_status === 'online');
    const offlineDrivers = drivers.filter(d => d.availability_status === 'offline');
    console.log(`📊 Availability Status: ${onlineDrivers.length} online, ${offlineDrivers.length} offline`);
    
    // Vehicle type filter
    const vehicleTypes = [...new Set(drivers.map(d => d.vehicleType))];
    console.log(`📊 Vehicle Types in use: ${vehicleTypes.join(', ')}`);
    
    console.log('\n✅ Driver filtering data is ready for Admin Panel!');

  } catch (error) {
    console.error('❌ Error testing APIs:', error.response?.data || error.message);
  }
}

testAdminPanelAPIs();
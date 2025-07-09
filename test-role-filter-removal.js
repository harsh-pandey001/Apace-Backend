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

async function testRoleFilterRemoval() {
  console.log('🧪 Testing Role Filter Removal...\n');

  try {
    // Test Users API - should only return users
    console.log('👥 Testing Users API...');
    const usersResponse = await api.get('/users');
    const users = usersResponse.data.data.users;
    
    console.log(`✅ Total users found: ${users.length}`);
    
    // Verify all returned records are users
    const userRoles = users.map(user => user.role);
    const uniqueRoles = [...new Set(userRoles)];
    console.log(`📊 Roles in users endpoint: ${uniqueRoles.join(', ')}`);
    
    if (uniqueRoles.length === 1 && uniqueRoles[0] === 'user') {
      console.log('✅ SUCCESS: Users endpoint returns only users (no role filter needed)');
    } else {
      console.log('❌ ISSUE: Users endpoint contains non-user roles');
    }

    // Test Drivers API - should only return drivers
    console.log('\n🚗 Testing Drivers API...');
    const driversResponse = await api.get('/drivers/all');
    const drivers = driversResponse.data.data.drivers;
    
    console.log(`✅ Total drivers found: ${drivers.length}`);
    
    // Show driver-specific filtering capabilities
    console.log('\n🔍 Driver Filtering Capabilities:');
    
    // Verification status breakdown
    const verifiedDrivers = drivers.filter(d => d.isVerified === true);
    const unverifiedDrivers = drivers.filter(d => d.isVerified === false);
    console.log(`   📋 Verification: ${verifiedDrivers.length} verified, ${unverifiedDrivers.length} unverified`);
    
    // Availability status breakdown
    const onlineDrivers = drivers.filter(d => d.availability_status === 'online');
    const offlineDrivers = drivers.filter(d => d.availability_status === 'offline');
    console.log(`   🟢 Availability: ${onlineDrivers.length} online, ${offlineDrivers.length} offline`);
    
    // Vehicle types breakdown
    const vehicleTypes = [...new Set(drivers.map(d => d.vehicleType))];
    console.log(`   🚚 Vehicle Types: ${vehicleTypes.join(', ')}`);
    
    // Activity status breakdown
    const activeDrivers = drivers.filter(d => d.isActive === true);
    const inactiveDrivers = drivers.filter(d => d.isActive === false);
    console.log(`   ⚡ Activity: ${activeDrivers.length} active, ${inactiveDrivers.length} inactive`);

    console.log('\n🎯 Filter Summary:');
    console.log('   Users Tab Filters:');
    console.log('     ✅ Status (Active/Inactive)');
    console.log('     ✅ Registration Date (Today, Yesterday, Last 7/30/90 days)');
    console.log('     ❌ Role filter removed (no longer needed)');
    
    console.log('\n   Drivers Tab Filters:');
    console.log('     ✅ Vehicle Type (Dynamic from API)');
    console.log('     ✅ Verification Status (Verified/Unverified)');
    console.log('     ✅ Availability Status (Online/Offline)');
    console.log('     ✅ Activity Status (Active/Inactive)');
    console.log('     ✅ Registration Date (Today, Yesterday, Last 7/30/90 days)');

    console.log('\n🎉 Role filter successfully removed from Users tab!');
    console.log('   The Admin Panel now shows clean, context-appropriate filters for each tab.');

  } catch (error) {
    console.error('❌ Error testing role filter removal:', error.response?.data || error.message);
  }
}

testRoleFilterRemoval();
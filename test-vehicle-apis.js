const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const ADMIN_CREDENTIALS = {
  phone: '+1234567890',
  otp: '123456' // This should be generated from the admin seeded phone number
};

let adminToken = '';

// Helper function to log test results
const logTest = (testName, success, data = null, error = null) => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`TEST: ${testName}`);
  console.log(`STATUS: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  if (data) console.log('RESPONSE:', JSON.stringify(data, null, 2));
  if (error) console.log('ERROR:', error.message || error);
  console.log(`${'='.repeat(50)}`);
};

// Helper function to get admin token
const getAdminToken = async () => {
  try {
    // First request OTP for admin user
    await axios.post(`${BASE_URL}/api/auth/request-otp`, {
      phone: ADMIN_CREDENTIALS.phone
    });
    
    // Then verify OTP to get token
    const response = await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
      phone: ADMIN_CREDENTIALS.phone,
      otp: ADMIN_CREDENTIALS.otp
    });
    
    adminToken = response.data.data.accessToken;
    console.log('✅ Admin token obtained successfully');
    return adminToken;
  } catch (error) {
    console.log('❌ Failed to get admin token:', error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testHealthCheck = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    logTest('Health Check', response.status === 200, response.data);
    return true;
  } catch (error) {
    logTest('Health Check', false, null, error.response?.data || error.message);
    return false;
  }
};

const testGetAllVehicleTypes = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/vehicles`);
    const success = response.status === 200 && Array.isArray(response.data.data);
    logTest('GET /api/vehicles (Public)', success, response.data);
    return success;
  } catch (error) {
    logTest('GET /api/vehicles (Public)', false, null, error.response?.data || error.message);
    return false;
  }
};

const testGetVehiclePricing = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/vehicles/mini_truck/pricing`);
    const success = response.status === 200 && response.data.data.vehicleType === 'mini_truck';
    logTest('GET /api/vehicles/:vehicleType/pricing (Public)', success, response.data);
    return success;
  } catch (error) {
    logTest('GET /api/vehicles/:vehicleType/pricing (Public)', false, null, error.response?.data || error.message);
    return false;
  }
};

const testCreateVehicleType = async () => {
  try {
    const newVehicleType = {
      vehicleType: 'heavy_truck',
      label: 'Heavy Truck',
      capacity: 'Up to 2000kg',
      basePrice: 500.00,
      pricePerKm: 25.00,
      startingPrice: 100.00
    };
    
    const response = await axios.post(`${BASE_URL}/api/vehicles`, newVehicleType, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const success = response.status === 201 && response.data.data.vehicleType === 'heavy_truck';
    logTest('POST /api/vehicles (Admin)', success, response.data);
    return success ? response.data.data.id : false;
  } catch (error) {
    logTest('POST /api/vehicles (Admin)', false, null, error.response?.data || error.message);
    return false;
  }
};

const testCreateDuplicateVehicleType = async () => {
  try {
    const duplicateVehicleType = {
      vehicleType: 'bike', // This already exists
      label: 'Another Bike',
      capacity: 'Up to 10kg',
      basePrice: 60.00,
      pricePerKm: 6.00,
      startingPrice: 25.00
    };
    
    const response = await axios.post(`${BASE_URL}/api/vehicles`, duplicateVehicleType, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // This should fail with 409 conflict
    logTest('POST /api/vehicles (Duplicate - Should Fail)', false, response.data, 'Expected failure did not occur');
    return false;
  } catch (error) {
    const success = error.response?.status === 409;
    logTest('POST /api/vehicles (Duplicate - Should Fail)', success, null, error.response?.data || error.message);
    return success;
  }
};

const testCreateVehicleTypeValidationError = async () => {
  try {
    const invalidVehicleType = {
      vehicleType: '', // Empty - should fail
      label: 'Test Vehicle',
      capacity: 'Up to 100kg',
      basePrice: -50.00, // Negative - should fail
      pricePerKm: 10.00,
      startingPrice: 30.00
    };
    
    const response = await axios.post(`${BASE_URL}/api/vehicles`, invalidVehicleType, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // This should fail with 400 validation error
    logTest('POST /api/vehicles (Validation Error - Should Fail)', false, response.data, 'Expected validation failure did not occur');
    return false;
  } catch (error) {
    const success = error.response?.status === 400;
    logTest('POST /api/vehicles (Validation Error - Should Fail)', success, null, error.response?.data || error.message);
    return success;
  }
};

const testUpdateVehicleType = async (vehicleId) => {
  if (!vehicleId) {
    logTest('PUT /api/vehicles/:id (Admin)', false, null, 'No vehicle ID available for update test');
    return false;
  }
  
  try {
    const updateData = {
      basePrice: 550.00,
      pricePerKm: 28.00,
      capacity: 'Up to 2500kg'
    };
    
    const response = await axios.put(`${BASE_URL}/api/vehicles/${vehicleId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const success = response.status === 200 && parseFloat(response.data.data.basePrice) === 550.00;
    logTest('PUT /api/vehicles/:id (Admin)', success, response.data);
    return success;
  } catch (error) {
    logTest('PUT /api/vehicles/:id (Admin)', false, null, error.response?.data || error.message);
    return false;
  }
};

const testUnauthorizedAccess = async () => {
  try {
    const newVehicleType = {
      vehicleType: 'test_vehicle',
      label: 'Test Vehicle',
      capacity: 'Up to 100kg',
      basePrice: 100.00,
      pricePerKm: 10.00,
      startingPrice: 30.00
    };
    
    const response = await axios.post(`${BASE_URL}/api/vehicles`, newVehicleType);
    
    // This should fail with 401 unauthorized
    logTest('POST /api/vehicles (No Auth - Should Fail)', false, response.data, 'Expected unauthorized failure did not occur');
    return false;
  } catch (error) {
    const success = error.response?.status === 401;
    logTest('POST /api/vehicles (No Auth - Should Fail)', success, null, error.response?.data || error.message);
    return success;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Vehicle Type API Tests...\n');
  
  const results = [];
  
  // Basic connectivity
  results.push(await testHealthCheck());
  
  // Public API tests
  results.push(await testGetAllVehicleTypes());
  results.push(await testGetVehiclePricing());
  
  // Get admin token for protected routes
  try {
    await getAdminToken();
  } catch (error) {
    console.log('❌ Cannot proceed with protected route tests without admin token');
    return;
  }
  
  // Protected API tests
  results.push(await testUnauthorizedAccess());
  const newVehicleId = await testCreateVehicleType();
  results.push(!!newVehicleId);
  results.push(await testCreateDuplicateVehicleType());
  results.push(await testCreateVehicleTypeValidationError());
  results.push(await testUpdateVehicleType(newVehicleId));
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎯 TEST SUMMARY: ${passed}/${total} tests passed`);
  console.log(`${passed === total ? '✅ All tests passed!' : '❌ Some tests failed'}`);
  console.log(`${'='.repeat(60)}`);
};

// Run tests
runAllTests().catch(console.error);
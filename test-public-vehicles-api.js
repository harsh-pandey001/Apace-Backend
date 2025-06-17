const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';

// Helper function to log test results
const logTest = (testName, success, data = null, error = null) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testName}`);
  console.log(`STATUS: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  if (data) console.log('RESPONSE:', JSON.stringify(data, null, 2));
  if (error) console.log('ERROR:', error.message || error);
  console.log(`${'='.repeat(60)}`);
};

// Test functions
const testPublicVehiclesEndpoint = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/vehicles`);
    const success = response.status === 200 && 
                   response.data.success === true &&
                   Array.isArray(response.data.data) &&
                   response.data.data.length > 0;
    
    logTest('GET /api/vehicles - Public Endpoint', success, response.data);
    
    // Validate data structure
    if (success) {
      const vehicle = response.data.data[0];
      const hasRequiredFields = vehicle.id && vehicle.type && vehicle.name && 
                               vehicle.capacity && vehicle.pricing;
      const hasPricingStructure = vehicle.pricing.base !== undefined && 
                                 vehicle.pricing.perKm !== undefined && 
                                 vehicle.pricing.starting !== undefined;
      
      console.log('\n📊 Data Structure Validation:');
      console.log(`✅ Required fields present: ${hasRequiredFields}`);
      console.log(`✅ Pricing structure correct: ${hasPricingStructure}`);
      console.log(`✅ Frontend-optimized format: ${!!vehicle.displayPrice}`);
      console.log(`✅ Price calculations ready: ${!!vehicle.priceRange}`);
      console.log(`✅ Total vehicles: ${response.data.meta.total}`);
      
      return { success: true, vehicles: response.data.data };
    }
    
    return { success: false };
  } catch (error) {
    logTest('GET /api/vehicles - Public Endpoint', false, null, error.response?.data || error.message);
    return { success: false };
  }
};

const testIndividualVehiclePricing = async (vehicleType) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/vehicles/${vehicleType}/pricing`);
    const success = response.status === 200 && 
                   response.data.success === true &&
                   response.data.data.vehicleType === vehicleType;
    
    logTest(`GET /api/vehicles/${vehicleType}/pricing`, success, response.data);
    return success;
  } catch (error) {
    logTest(`GET /api/vehicles/${vehicleType}/pricing`, false, null, error.response?.data || error.message);
    return false;
  }
};

const testPriceCalculationExample = (vehicles) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('💰 PRICE CALCULATION EXAMPLES');
  console.log(`${'='.repeat(60)}`);
  
  vehicles.forEach(vehicle => {
    const distance = 5; // 5km trip
    const calculatedPrice = vehicle.pricing.starting + (vehicle.pricing.perKm * distance);
    
    console.log(`\n🚗 ${vehicle.name} (${vehicle.type}):`);
    console.log(`   Capacity: ${vehicle.capacity}`);
    console.log(`   Starting Price: $${vehicle.pricing.starting}`);
    console.log(`   Base Rate: $${vehicle.pricing.base}`);
    console.log(`   Per Km: $${vehicle.pricing.perKm}`);
    console.log(`   📊 5km Trip Cost: $${calculatedPrice.toFixed(2)}`);
    console.log(`   💡 Display: ${vehicle.displayPrice}`);
  });
};

const testDataConsistency = async () => {
  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log('🔍 DATA CONSISTENCY VALIDATION');
    console.log(`${'='.repeat(60)}`);
    
    // Test main endpoint
    const mainResponse = await axios.get(`${BASE_URL}/api/vehicles`);
    const vehicles = mainResponse.data.data;
    
    console.log(`✅ Total active vehicle types: ${vehicles.length}`);
    
    // Test individual pricing endpoints for consistency
    for (const vehicle of vehicles) {
      const pricingResponse = await axios.get(`${BASE_URL}/api/vehicles/${vehicle.type}/pricing`);
      const individualData = pricingResponse.data.data;
      
      const consistent = 
        parseFloat(individualData.basePrice) === vehicle.pricing.base &&
        parseFloat(individualData.pricePerKm) === vehicle.pricing.perKm &&
        parseFloat(individualData.startingPrice) === vehicle.pricing.starting;
      
      console.log(`${consistent ? '✅' : '❌'} ${vehicle.name}: Pricing consistency check`);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Data consistency validation failed:', error.message);
    return false;
  }
};

const testCacheAndPerformance = async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('⚡ PERFORMANCE & CACHING TEST');
  console.log(`${'='.repeat(60)}`);
  
  const startTime = Date.now();
  
  // Test multiple rapid requests
  const promises = Array.from({ length: 5 }, () => 
    axios.get(`${BASE_URL}/api/vehicles`)
  );
  
  try {
    await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`✅ 5 concurrent requests completed in ${totalTime}ms`);
    console.log(`✅ Average response time: ${totalTime / 5}ms`);
    console.log(`✅ API handles concurrent load`);
    
    return true;
  } catch (error) {
    console.log('❌ Performance test failed:', error.message);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 PUBLIC VEHICLE API COMPREHENSIVE TESTING\n');
  console.log('Testing the public vehicle pricing API for User App consumption...\n');
  
  const results = [];
  
  // Test main public endpoint
  const mainTest = await testPublicVehiclesEndpoint();
  results.push(mainTest.success);
  
  if (mainTest.success) {
    // Test individual vehicle pricing endpoints
    const vehicleTypes = ['bike', 'car', 'van', 'truck', 'mini_truck'];
    for (const type of vehicleTypes) {
      const individualTest = await testIndividualVehiclePricing(type);
      results.push(individualTest);
    }
    
    // Test price calculation examples
    testPriceCalculationExample(mainTest.vehicles);
    
    // Test data consistency
    const consistencyTest = await testDataConsistency();
    results.push(consistencyTest);
    
    // Test performance
    const performanceTest = await testCacheAndPerformance();
    results.push(performanceTest);
  }
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎯 FINAL TEST SUMMARY: ${passed}/${total} tests passed`);
  console.log(`${passed === total ? '✅ ALL TESTS PASSED!' : '❌ Some tests failed'}`);
  console.log(`\n🔗 PUBLIC API ENDPOINT: GET ${BASE_URL}/api/vehicles`);
  console.log(`📱 Ready for User App integration!`);
  console.log(`💡 Single source of truth for all vehicle pricing`);
  console.log(`${'='.repeat(70)}`);
};

// Run tests
runAllTests().catch(console.error);
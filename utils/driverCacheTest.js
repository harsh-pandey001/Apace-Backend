const driverCacheManager = require('./driverCache');
const { setupLogger } = require('./logger');

const logger = setupLogger();

/**
 * Driver cache testing utility
 */
class DriverCacheTest {
  
  /**
   * Test driver profile caching
   */
  static async testDriverProfileCache() {
    logger.info('Testing driver profile cache...');
    
    try {
      const driverId = 'test-driver-123';
      const profileData = {
        id: driverId,
        name: 'Test Driver',
        email: 'driver@test.com',
        phone: '+1234567890',
        vehicleType: 'bike',
        isActive: true,
        isVerified: true
      };
      
      // Test caching
      const cacheResult = await driverCacheManager.cacheDriverProfile(driverId, profileData, 300);
      logger.info(`Driver profile cache SET: ${cacheResult ? 'PASSED' : 'FAILED'}`);
      
      // Test retrieval
      const cachedProfile = await driverCacheManager.getDriverProfile(driverId);
      const retrievalResult = cachedProfile && cachedProfile.id === driverId;
      logger.info(`Driver profile cache GET: ${retrievalResult ? 'PASSED' : 'FAILED'}`);
      
      // Test invalidation
      const invalidateResult = await driverCacheManager.invalidateDriverCache(driverId, 'profile');
      logger.info(`Driver profile cache INVALIDATE: ${invalidateResult ? 'PASSED' : 'FAILED'}`);
      
      // Verify invalidation
      const afterInvalidate = await driverCacheManager.getDriverProfile(driverId);
      const invalidateVerify = afterInvalidate === null;
      logger.info(`Driver profile invalidation verify: ${invalidateVerify ? 'PASSED' : 'FAILED'}`);
      
      return {
        cache: cacheResult,
        retrieval: retrievalResult,
        invalidate: invalidateResult,
        invalidateVerify: invalidateVerify,
        overall: cacheResult && retrievalResult && invalidateResult && invalidateVerify
      };
      
    } catch (error) {
      logger.error('Driver profile cache test failed:', error);
      return { overall: false, error: error.message };
    }
  }
  
  /**
   * Test driver status caching
   */
  static async testDriverStatusCache() {
    logger.info('Testing driver status cache...');
    
    try {
      const driverId = 'test-driver-456';
      const statusData = {
        driverId,
        availability_status: 'available',
        location: { lat: 40.7128, lng: -74.0060 },
        lastUpdated: new Date().toISOString()
      };
      
      // Test caching and retrieval
      await driverCacheManager.cacheDriverStatus(driverId, statusData, 300);
      const cachedStatus = await driverCacheManager.getDriverStatus(driverId);
      const statusTest = cachedStatus && cachedStatus.availability_status === 'available';
      
      logger.info(`Driver status cache test: ${statusTest ? 'PASSED' : 'FAILED'}`);
      
      // Clean up
      await driverCacheManager.invalidateDriverCache(driverId, 'status');
      
      return { overall: statusTest };
      
    } catch (error) {
      logger.error('Driver status cache test failed:', error);
      return { overall: false, error: error.message };
    }
  }
  
  /**
   * Test driver shipments caching
   */
  static async testDriverShipmentsCache() {
    logger.info('Testing driver shipments cache...');
    
    try {
      const driverId = 'test-driver-789';
      const shipmentsData = [
        {
          id: 'ship-1',
          status: 'in_transit',
          pickupAddress: '123 Main St',
          deliveryAddress: '456 Oak Ave',
          driverId: driverId
        },
        {
          id: 'ship-2', 
          status: 'pending',
          pickupAddress: '789 Pine St',
          deliveryAddress: '321 Elm Ave',
          driverId: driverId
        }
      ];
      
      // Test caching and retrieval
      await driverCacheManager.cacheDriverShipments(driverId, shipmentsData, 180);
      const cachedShipments = await driverCacheManager.getDriverShipments(driverId);
      const shipmentsTest = cachedShipments && Array.isArray(cachedShipments) && cachedShipments.length === 2;
      
      logger.info(`Driver shipments cache test: ${shipmentsTest ? 'PASSED' : 'FAILED'}`);
      
      // Test shipments invalidation
      const invalidateResult = await driverCacheManager.invalidateDriverShipmentsCache(driverId);
      const invalidateTest = invalidateResult;
      logger.info(`Driver shipments invalidation test: ${invalidateTest ? 'PASSED' : 'FAILED'}`);
      
      return { 
        cache: shipmentsTest,
        invalidate: invalidateTest,
        overall: shipmentsTest && invalidateTest 
      };
      
    } catch (error) {
      logger.error('Driver shipments cache test failed:', error);
      return { overall: false, error: error.message };
    }
  }
  
  /**
   * Test driver documents caching
   */
  static async testDriverDocumentsCache() {
    logger.info('Testing driver documents cache...');
    
    try {
      const driverId = 'test-driver-docs';
      const documentsData = {
        driverId,
        license: { status: 'verified', url: '/uploads/license.pdf' },
        passportPhoto: { status: 'verified', url: '/uploads/photo.jpg' },
        vehicleRC: { status: 'pending', url: '/uploads/rc.pdf' },
        insurance: { status: 'pending', url: '/uploads/insurance.pdf' }
      };
      
      // Test caching and retrieval
      await driverCacheManager.cacheDriverDocuments(driverId, documentsData, 600);
      const cachedDocs = await driverCacheManager.getDriverDocuments(driverId);
      const docsTest = cachedDocs && cachedDocs.license && cachedDocs.license.status === 'verified';
      
      logger.info(`Driver documents cache test: ${docsTest ? 'PASSED' : 'FAILED'}`);
      
      // Clean up
      await driverCacheManager.invalidateDriverCache(driverId, 'documents');
      
      return { overall: docsTest };
      
    } catch (error) {
      logger.error('Driver documents cache test failed:', error);
      return { overall: false, error: error.message };
    }
  }
  
  /**
   * Test driver cache key generation
   */
  static async testDriverCacheKeys() {
    logger.info('Testing driver cache key generation...');
    
    try {
      const driverId = 'test-123';
      
      const profileKey = driverCacheManager.generateDriverKey('profile', driverId);
      const statusKey = driverCacheManager.generateDriverKey('status', driverId);
      const shipmentsKey = driverCacheManager.generateDriverKey('shipments', driverId, 'assigned');
      const docsKey = driverCacheManager.generateDriverKey('documents', driverId);
      
      const profileTest = profileKey === 'driver:profile:test-123';
      const statusTest = statusKey === 'driver:status:test-123';
      const shipmentsTest = shipmentsKey === 'driver:shipments:test-123:assigned';
      const docsTest = docsKey === 'driver:documents:test-123';
      
      logger.info(`Profile key test: ${profileTest ? 'PASSED' : 'FAILED'} (${profileKey})`);
      logger.info(`Status key test: ${statusTest ? 'PASSED' : 'FAILED'} (${statusKey})`);
      logger.info(`Shipments key test: ${shipmentsTest ? 'PASSED' : 'FAILED'} (${shipmentsKey})`);
      logger.info(`Documents key test: ${docsTest ? 'PASSED' : 'FAILED'} (${docsKey})`);
      
      return {
        profile: profileTest,
        status: statusTest,
        shipments: shipmentsTest,
        documents: docsTest,
        overall: profileTest && statusTest && shipmentsTest && docsTest
      };
      
    } catch (error) {
      logger.error('Driver cache key test failed:', error);
      return { overall: false, error: error.message };
    }
  }
  
  /**
   * Test cache-aside pattern for driver data
   */
  static async testDriverCacheAside() {
    logger.info('Testing driver cache-aside pattern...');
    
    try {
      const driverId = 'test-aside-123';
      let fetchCount = 0;
      
      const mockFetchFunction = async () => {
        fetchCount++;
        return {
          id: driverId,
          name: 'Cache Aside Driver',
          fetchCount
        };
      };
      
      // First call should fetch from source
      const firstResult = await driverCacheManager.getOrSetDriverData(
        driverId, 
        'profile', 
        mockFetchFunction, 
        300
      );
      const firstTest = firstResult.fetchCount === 1 && fetchCount === 1;
      
      // Second call should use cache
      const secondResult = await driverCacheManager.getOrSetDriverData(
        driverId, 
        'profile', 
        mockFetchFunction, 
        300
      );
      const secondTest = secondResult.fetchCount === 1 && fetchCount === 1; // Should still be 1
      
      logger.info(`Cache-aside first fetch test: ${firstTest ? 'PASSED' : 'FAILED'}`);
      logger.info(`Cache-aside cache hit test: ${secondTest ? 'PASSED' : 'FAILED'}`);
      
      // Clean up
      await driverCacheManager.invalidateDriverCache(driverId, 'profile');
      
      return {
        firstFetch: firstTest,
        cacheHit: secondTest,
        overall: firstTest && secondTest
      };
      
    } catch (error) {
      logger.error('Driver cache-aside test failed:', error);
      return { overall: false, error: error.message };
    }
  }
  
  /**
   * Test all driver cache invalidation
   */
  static async testAllDriverCacheInvalidation() {
    logger.info('Testing all driver cache invalidation...');
    
    try {
      const driverId = 'test-all-invalidate';
      
      // Cache multiple types of data
      await driverCacheManager.cacheDriverProfile(driverId, { name: 'Test' }, 300);
      await driverCacheManager.cacheDriverStatus(driverId, { status: 'available' }, 300);
      await driverCacheManager.cacheDriverShipments(driverId, [{ id: 'ship1' }], 300);
      
      // Invalidate all
      const invalidateCount = await driverCacheManager.invalidateAllDriverCache(driverId);
      const invalidateTest = invalidateCount >= 3; // Should invalidate at least 3 keys
      
      logger.info(`All driver cache invalidation test: ${invalidateTest ? 'PASSED' : 'FAILED'} (${invalidateCount} keys)`);
      
      return { overall: invalidateTest };
      
    } catch (error) {
      logger.error('All driver cache invalidation test failed:', error);
      return { overall: false, error: error.message };
    }
  }
  
  /**
   * Run all driver cache tests
   */
  static async runAllDriverCacheTests() {
    logger.info('=== Starting comprehensive driver cache tests ===');
    
    const results = {
      profileCache: await this.testDriverProfileCache(),
      statusCache: await this.testDriverStatusCache(),
      shipmentsCache: await this.testDriverShipmentsCache(),
      documentsCache: await this.testDriverDocumentsCache(),
      keyGeneration: await this.testDriverCacheKeys(),
      cacheAside: await this.testDriverCacheAside(),
      allInvalidation: await this.testAllDriverCacheInvalidation()
    };
    
    const overallSuccess = Object.values(results).every(result => result.overall);
    
    logger.info('=== Driver cache test results ===');
    logger.info(`Profile cache: ${results.profileCache.overall ? 'PASSED' : 'FAILED'}`);
    logger.info(`Status cache: ${results.statusCache.overall ? 'PASSED' : 'FAILED'}`);
    logger.info(`Shipments cache: ${results.shipmentsCache.overall ? 'PASSED' : 'FAILED'}`);
    logger.info(`Documents cache: ${results.documentsCache.overall ? 'PASSED' : 'FAILED'}`);
    logger.info(`Key generation: ${results.keyGeneration.overall ? 'PASSED' : 'FAILED'}`);
    logger.info(`Cache-aside pattern: ${results.cacheAside.overall ? 'PASSED' : 'FAILED'}`);
    logger.info(`All invalidation: ${results.allInvalidation.overall ? 'PASSED' : 'FAILED'}`);
    logger.info(`Overall: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    return {
      ...results,
      overall: overallSuccess
    };
  }
}

module.exports = DriverCacheTest;
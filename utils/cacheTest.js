const cacheManager = require('./cache');
const { setupLogger } = require('./logger');

const logger = setupLogger();

/**
 * Cache testing utility to verify Redis functionality
 */
class CacheTest {
  
  /**
   * Test basic cache operations
   */
  static async testBasicOperations() {
    logger.info('Starting cache functionality test...');
    
    try {
      const testKey = 'test:cache:basic';
      const testData = { message: 'Hello Redis!', timestamp: Date.now() };
      
      // Test SET operation
      const setResult = await cacheManager.setToCache(testKey, testData, 60);
      logger.info(`Cache SET test: ${setResult ? 'PASSED' : 'FAILED'}`);
      
      // Test GET operation
      const getCachedData = await cacheManager.getFromCache(testKey);
      const getResult = getCachedData && getCachedData.message === testData.message;
      logger.info(`Cache GET test: ${getResult ? 'PASSED' : 'FAILED'}`);
      
      // Test cache key generation
      const userKey = cacheManager.generateKey('user', 'profile', '123');
      const keyGenResult = userKey === 'apace:user:profile:123';
      logger.info(`Key generation test: ${keyGenResult ? 'PASSED' : 'FAILED'}`);
      
      // Test invalidation
      const invalidateResult = await cacheManager.invalidateCache(testKey);
      logger.info(`Cache INVALIDATE test: ${invalidateResult ? 'PASSED' : 'FAILED'}`);
      
      // Verify invalidation worked
      const afterInvalidate = await cacheManager.getFromCache(testKey);
      const invalidateVerify = afterInvalidate === null;
      logger.info(`Cache invalidation verify: ${invalidateVerify ? 'PASSED' : 'FAILED'}`);
      
      return {
        set: setResult,
        get: getResult,
        keyGeneration: keyGenResult,
        invalidate: invalidateResult,
        invalidateVerify: invalidateVerify,
        overall: setResult && getResult && keyGenResult && invalidateResult && invalidateVerify
      };
      
    } catch (error) {
      logger.error('Cache test failed:', error);
      return { overall: false, error: error.message };
    }
  }
  
  /**
   * Test user-specific cache operations
   */
  static async testUserCache() {
    logger.info('Starting user cache test...');
    
    try {
      const userId = 'test-user-123';
      const profileData = { name: 'Test User', email: 'test@example.com' };
      const shipmentsData = [{ id: 1, status: 'pending' }];
      
      // Test user profile caching
      await cacheManager.cacheUserData(userId, 'profile', profileData, 120);
      const cachedProfile = await cacheManager.getUserCachedData(userId, 'profile');
      const profileTest = cachedProfile && cachedProfile.name === profileData.name;
      
      // Test user shipments caching
      await cacheManager.cacheUserData(userId, 'shipments', shipmentsData, 120);
      const cachedShipments = await cacheManager.getUserCachedData(userId, 'shipments');
      const shipmentsTest = cachedShipments && Array.isArray(cachedShipments) && cachedShipments.length === 1;
      
      // Test user cache invalidation
      const invalidateCount = await cacheManager.invalidateUserCache(userId);
      const invalidateTest = invalidateCount >= 2; // Should invalidate both profile and shipments
      
      logger.info(`User profile cache test: ${profileTest ? 'PASSED' : 'FAILED'}`);
      logger.info(`User shipments cache test: ${shipmentsTest ? 'PASSED' : 'FAILED'}`);
      logger.info(`User cache invalidation test: ${invalidateTest ? 'PASSED' : 'FAILED'}`);
      
      return {
        profile: profileTest,
        shipments: shipmentsTest,
        invalidate: invalidateTest,
        overall: profileTest && shipmentsTest && invalidateTest
      };
      
    } catch (error) {
      logger.error('User cache test failed:', error);
      return { overall: false, error: error.message };
    }
  }
  
  /**
   * Test cache-aside pattern
   */
  static async testCacheAside() {
    logger.info('Starting cache-aside pattern test...');
    
    try {
      const cacheKey = 'test:cache-aside:data';
      let fetchCount = 0;
      
      // Mock fetch function
      const mockFetch = async () => {
        fetchCount++;
        return { data: 'fetched data', fetchCount };
      };
      
      // First call should fetch from source
      const firstResult = await cacheManager.getOrSet(cacheKey, mockFetch, 60);
      const firstTest = firstResult.fetchCount === 1 && fetchCount === 1;
      
      // Second call should use cache
      const secondResult = await cacheManager.getOrSet(cacheKey, mockFetch, 60);
      const secondTest = secondResult.fetchCount === 1 && fetchCount === 1; // fetchCount should still be 1
      
      logger.info(`Cache-aside first fetch test: ${firstTest ? 'PASSED' : 'FAILED'}`);
      logger.info(`Cache-aside cache hit test: ${secondTest ? 'PASSED' : 'FAILED'}`);
      
      // Clean up
      await cacheManager.invalidateCache(cacheKey);
      
      return {
        firstFetch: firstTest,
        cacheHit: secondTest,
        overall: firstTest && secondTest
      };
      
    } catch (error) {
      logger.error('Cache-aside test failed:', error);
      return { overall: false, error: error.message };
    }
  }
  
  /**
   * Run all cache tests
   */
  static async runAllTests() {
    logger.info('=== Starting comprehensive cache tests ===');
    
    const results = {
      basic: await this.testBasicOperations(),
      userCache: await this.testUserCache(),
      cacheAside: await this.testCacheAside()
    };
    
    const overallSuccess = results.basic.overall && results.userCache.overall && results.cacheAside.overall;
    
    logger.info('=== Cache test results ===');
    logger.info(`Basic operations: ${results.basic.overall ? 'PASSED' : 'FAILED'}`);
    logger.info(`User cache operations: ${results.userCache.overall ? 'PASSED' : 'FAILED'}`);
    logger.info(`Cache-aside pattern: ${results.cacheAside.overall ? 'PASSED' : 'FAILED'}`);
    logger.info(`Overall: ${overallSuccess ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    return {
      ...results,
      overall: overallSuccess
    };
  }
}

module.exports = CacheTest;
const { VehicleType } = require('../models');

// Cache for vehicle types to avoid DB calls on every validation
let vehicleTypeCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get all active vehicle types from cache or database
 * @param {boolean} forceRefresh - Force refresh from database even if cache is valid
 * @returns {Promise<Array>} Array of active vehicle types
 */
async function getActiveVehicleTypes(forceRefresh = false) {
  const now = Date.now();
  
  // Check if cache is still valid (unless forcing refresh)
  if (!forceRefresh && vehicleTypeCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return vehicleTypeCache;
  }
  
  try {
    // Fetch from database
    const vehicleTypes = await VehicleType.findAll({
      where: { isActive: true },
      attributes: ['vehicleType'],
      order: [['vehicleType', 'ASC']]
    });
    
    // Extract vehicle type strings and convert to lowercase
    const vehicleTypeStrings = vehicleTypes.map(vt => vt.vehicleType.toLowerCase());
    
    // Update cache
    vehicleTypeCache = vehicleTypeStrings;
    cacheTimestamp = now;
    
    return vehicleTypeStrings;
  } catch (error) {
    console.error('Error fetching vehicle types for validation:', error);
    
    // If DB fails, return fallback hardcoded types
    return ['bike', 'car', 'van', 'truck', 'mini_truck'];
  }
}

/**
 * Validate if a vehicle type is valid (exists in active vehicle types)
 * @param {string} vehicleType - The vehicle type to validate
 * @param {boolean} forceRefresh - Force refresh from database
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
async function isValidVehicleType(vehicleType, forceRefresh = false) {
  if (!vehicleType) {
    return false;
  }
  
  const activeTypes = await getActiveVehicleTypes(forceRefresh);
  return activeTypes.includes(vehicleType.toLowerCase());
}

/**
 * Get formatted list of valid vehicle types for error messages
 * @param {boolean} forceRefresh - Force refresh from database
 * @returns {Promise<string>} Comma-separated list of valid vehicle types
 */
async function getValidVehicleTypesMessage(forceRefresh = false) {
  const activeTypes = await getActiveVehicleTypes(forceRefresh);
  return activeTypes.join(', ');
}

/**
 * Clear the cache (useful for testing or manual cache invalidation)
 */
function clearCache() {
  vehicleTypeCache = null;
  cacheTimestamp = null;
}

module.exports = {
  getActiveVehicleTypes,
  isValidVehicleType,
  getValidVehicleTypesMessage,
  clearCache
};
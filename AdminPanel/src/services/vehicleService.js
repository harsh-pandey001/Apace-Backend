import api from './api';

/**
 * Service for vehicle type pricing management API calls
 */
export const vehicleService = {
  /**
   * Get all vehicle types with pricing (Admin interface)
   * @returns {Promise} - Promise with vehicle types data
   */
  getAllVehicleTypes: async () => {
    try {
      const response = await api.get('/vehicles/admin/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      throw error;
    }
  },

  /**
   * Get public vehicle types (optimized for frontend)
   * @returns {Promise} - Promise with vehicle types data
   */
  getPublicVehicleTypes: async () => {
    try {
      const response = await api.get('/vehicles');
      return response.data;
    } catch (error) {
      console.error('Error fetching public vehicle types:', error);
      throw error;
    }
  },

  /**
   * Get a single vehicle type by ID
   * @param {string} id - Vehicle type ID
   * @returns {Promise} - Promise with vehicle type data
   */
  getVehicleTypeById: async (id) => {
    try {
      const response = await api.get(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicle type ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new vehicle type
   * @param {Object} vehicleData - Vehicle type data
   * @returns {Promise} - Promise with created vehicle type data
   */
  createVehicleType: async (vehicleData) => {
    try {
      const response = await api.post('/vehicles', vehicleData);
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle type:', error);
      throw error;
    }
  },

  /**
   * Update vehicle type pricing
   * @param {string} id - Vehicle type ID
   * @param {Object} updateData - Data to update
   * @returns {Promise} - Promise with updated vehicle type data
   */
  updateVehicleType: async (id, updateData) => {
    try {
      const response = await api.put(`/vehicles/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error(`Error updating vehicle type ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete (deactivate) vehicle type
   * @param {string} id - Vehicle type ID
   * @returns {Promise} - Promise with success message
   */
  deleteVehicleType: async (id) => {
    try {
      const response = await api.delete(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting vehicle type ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get pricing for a specific vehicle type
   * @param {string} vehicleType - Vehicle type name
   * @returns {Promise} - Promise with pricing data
   */
  getVehiclePricing: async (vehicleType) => {
    try {
      const response = await api.get(`/vehicles/${vehicleType}/pricing`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching pricing for ${vehicleType}:`, error);
      throw error;
    }
  }
};

export default vehicleService;
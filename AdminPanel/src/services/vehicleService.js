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
  },

  /**
   * Get available vehicles for admin assignment (actual vehicle instances)
   * @returns {Promise} - Promise with available vehicles data
   */
  getAvailableVehicles: async () => {
    try {
      // Get available vehicle instances from the new endpoint
      const response = await api.get('/admin/vehicles/available');
      return response.data;
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      throw error;
    }
  },

  /**
   * Get all vehicles (admin only)
   * @returns {Promise} - Promise with all vehicles data
   */
  getAllVehicles: async () => {
    try {
      const response = await api.get('/admin/vehicles');
      return response.data;
    } catch (error) {
      console.error('Error fetching all vehicles:', error);
      throw error;
    }
  },

  /**
   * Get available drivers filtered by vehicle type (admin only)
   * @param {string} vehicleType - Vehicle type to filter by
   * @returns {Promise} - Promise with available drivers data
   */
  getAvailableDriversByVehicleType: async (vehicleType) => {
    try {
      const response = await api.get(`/drivers/available?vehicleType=${vehicleType}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching available drivers for ${vehicleType}:`, error);
      throw error;
    }
  },

  /**
   * Get available icon keys from the public vehicles API
   * @returns {Promise} - Promise with available icon keys
   */
  getAvailableIconKeys: async () => {
    try {
      const response = await api.get('/vehicles');
      const vehicleTypes = response.data.data || [];
      
      // Extract unique icon keys from the vehicle types
      const iconKeys = [...new Set(vehicleTypes.map(vehicle => vehicle.iconKey))];
      
      // Map to format expected by the UI
      const iconOptions = iconKeys.map(iconKey => ({
        label: iconKey.charAt(0).toUpperCase() + iconKey.slice(1),
        value: iconKey
      }));
      
      // Add some common additional icons that might not be in use yet
      const additionalIcons = [
        { label: 'Default', value: 'default' },
        { label: 'Bus', value: 'bus' },
        { label: 'Car', value: 'car' },
        { label: 'Motorcycle', value: 'motorcycle' }
      ];
      
      // Merge and remove duplicates
      const allOptions = [...iconOptions, ...additionalIcons];
      const uniqueOptions = allOptions.filter((option, index, array) => 
        array.findIndex(item => item.value === option.value) === index
      );
      
      return { data: uniqueOptions };
    } catch (error) {
      console.error('Error fetching icon keys:', error);
      // Return fallback options if API fails
      return {
        data: [
          { label: 'Truck', value: 'truck' },
          { label: 'Bike', value: 'bike' },
          { label: 'Car', value: 'car' },
          { label: 'Van', value: 'van' },
          { label: 'Bus', value: 'bus' },
          { label: 'Tractor', value: 'tractor' },
          { label: 'Container', value: 'container' },
          { label: 'Default', value: 'default' }
        ]
      };
    }
  },

  /**
   * Get vehicle type options for dropdowns (formatted for UI)
   * @returns {Promise} - Promise with vehicle type options
   */
  getVehicleTypeOptions: async () => {
    try {
      const response = await api.get('/vehicles');
      const vehicleTypes = response.data.data || [];
      
      // Map to format expected by the UI
      const typeOptions = vehicleTypes.map(vehicle => ({
        label: vehicle.name,
        value: vehicle.type,
        capacity: vehicle.capacity,
        iconKey: vehicle.iconKey
      }));
      
      return { data: typeOptions };
    } catch (error) {
      console.error('Error fetching vehicle type options:', error);
      // Return fallback options if API fails
      return {
        data: [
          { label: 'Three-wheeler', value: 'bike', capacity: '80 kg', iconKey: 'bike' },
          { label: 'Pickup', value: 'mini_truck', capacity: '5000 kg', iconKey: 'container' },
          { label: 'Truck', value: 'truck', capacity: '1000 kg', iconKey: 'truck' },
          { label: 'E-Rickshaws', value: 'van', capacity: '200 kg', iconKey: 'tractor' }
        ]
      };
    }
  }
};

export default vehicleService;
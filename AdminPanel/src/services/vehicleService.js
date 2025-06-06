import api from './api';

/**
 * Service for vehicle-related API calls
 */
export const vehicleService = {
  /**
   * Get all vehicles
   * @returns {Promise} - Promise with vehicle data
   */
  getAllVehicles: async () => {
    try {
      // Since there's no specific vehicles API endpoint, we'll need to create a mock
      // or update the backend to provide this endpoint. For now, we'll return mock data
      // that matches the vehicle structure we saw in the database
      
      // This should be replaced with actual API call when backend is updated
      const mockVehicles = [
        {
          id: '63ed86d2-ea58-40e6-ba73-af9be952595e',
          vehicleNumber: 'VEH-004',
          type: 'van',
          model: 'Mercedes Sprinter',
          licensePlate: 'ABC-1234',
          capacity: 15,
          maxWeight: 3500,
          status: 'available'
        },
        {
          id: '141a7eb4-a486-49fb-b37e-37421b87c238',
          vehicleNumber: 'VEH-001',
          type: 'van',
          model: 'Ford Transit',
          licensePlate: 'XYZ-5678',
          capacity: 12,
          maxWeight: 3000,
          status: 'available'
        },
        {
          id: 'db05559d-5fa6-4cca-b9b7-b94a658f5bbb',
          vehicleNumber: 'VEH-002',
          type: 'truck',
          model: 'Volvo FH',
          licensePlate: 'DEF-9012',
          capacity: 40,
          maxWeight: 15000,
          status: 'available'
        },
        {
          id: 'b0eb4309-7230-461c-b6a9-f5f435886e92',
          vehicleNumber: 'VEH-003',
          type: 'car',
          model: 'Toyota Corolla',
          licensePlate: 'GHI-3456',
          capacity: 0.5,
          maxWeight: 500,
          status: 'available'
        }
      ];

      return { data: { vehicles: mockVehicles } };
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  /**
   * Get a single vehicle by ID
   * @param {string} id - Vehicle ID
   * @returns {Promise} - Promise with vehicle data
   */
  getVehicleById: async (id) => {
    try {
      // This would be an actual API call when backend supports it
      const response = await api.get(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get available vehicles only
   * @returns {Promise} - Promise with available vehicle data
   */
  getAvailableVehicles: async () => {
    try {
      const response = await vehicleService.getAllVehicles();
      const vehicles = response.data.vehicles.filter(vehicle => 
        vehicle.status === 'available'
      );
      
      return { data: { vehicles } };
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      throw error;
    }
  }
};

export default vehicleService;
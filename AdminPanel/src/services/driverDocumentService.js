import api from './api';

const driverDocumentService = {
  // Get pending documents with pagination
  getPendingDocuments: async (page = 1, limit = 10, status = 'pending') => {
    try {
      const response = await api.get(`/admin/documents/pending?page=${page}&limit=${limit}&status=${status}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pending documents:', error);
      throw error;
    }
  },

  // Get driver documents by ID
  getDriverDocuments: async (driverId) => {
    try {
      const response = await api.get(`/driver/documents/${driverId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching driver documents:', error);
      throw error;
    }
  },

  // Verify/approve driver documents
  verifyDocuments: async (driverId, verifiedBy = null) => {
    try {
      const payload = verifiedBy ? { verifiedBy } : {};
      const response = await api.post(`/admin/documents/${driverId}/verify`, payload);
      return response.data;
    } catch (error) {
      console.error('Error verifying documents:', error);
      throw error;
    }
  },

  // Reject driver documents
  rejectDocuments: async (driverId, rejectionReason, rejectedBy = null) => {
    try {
      const payload = {
        rejectionReason,
        ...(rejectedBy && { rejectedBy })
      };
      const response = await api.post(`/admin/documents/${driverId}/reject`, payload);
      return response.data;
    } catch (error) {
      console.error('Error rejecting documents:', error);
      throw error;
    }
  },

  // Get document statistics for admin dashboard
  getDocumentStatistics: async () => {
    try {
      const response = await api.get('/admin/documents/statistics');
      return response.data;
    } catch (error) {
      console.error('Error fetching document statistics:', error);
      throw error;
    }
  }
};

export default driverDocumentService;
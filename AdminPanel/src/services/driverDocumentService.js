import api from './api';

const driverDocumentService = {
  // Get all documents with pagination (renamed from getPendingDocuments)
  getPendingDocuments: async (page = 1, limit = 10, status = null, search = null) => {
    try {
      // Build query parameters dynamically
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      // Only add status parameter if it's provided and not empty
      if (status && status.trim() !== '') {
        params.append('status', status);
      }
      
      // Only add search parameter if it's provided and not empty
      if (search && search.trim() !== '') {
        params.append('search', search);
      }
      
      const response = await api.get(`/admin/documents/pending?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching documents:', error);
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
  },

  // Delete a specific document
  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/admin/driver-documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
};

export default driverDocumentService;
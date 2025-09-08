const express = require('express');
const router = express.Router();
const driverDocumentController = require('../controllers/driverDocument.controller');
const adminDocumentController = require('../controllers/adminDocument.controller');
const { uploadDriverDocuments, handleUploadError } = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { normalizeDocumentQuery } = require('../middleware/normalizeQuery');
const driverDocumentValidation = require('../validations/driverDocument.validation');
const { 
  driverDocumentsCacheMiddleware, 
  clearDriverCacheMiddleware 
} = require('../middleware/driverCache');

// Upload handler with error handling
const uploadHandler = (req, res, next) => {
  uploadDriverDocuments(req, res, (error) => {
    if (error) {
      return handleUploadError(error, req, res, next);
    }
    next();
  });
};

// Driver Document Routes
router.post('/driver-documents/upload', 
  protect,
  uploadHandler,
  ...driverDocumentValidation.uploadDocuments,
  validate,
  clearDriverCacheMiddleware({ dataTypes: ['documents'] }),
  driverDocumentController.uploadDocuments
);

// Get current authenticated driver's documents (more secure) - with caching
router.get('/driver-documents/my',
  protect,
  driverDocumentsCacheMiddleware(600), // 10 minutes cache for documents
  driverDocumentController.getMyDocuments
);

// Get driver documents by ID (admin or specific driver access) - with caching
router.get('/driver-documents/:driverId',
  protect,
  ...driverDocumentValidation.getDriverDocuments,
  validate,
  driverDocumentsCacheMiddleware(600),
  driverDocumentController.getDriverDocuments
);

router.post('/driver-documents/:driverId/withdraw',
  protect,
  ...driverDocumentValidation.withdrawDocument,
  validate,
  clearDriverCacheMiddleware({ 
    dataTypes: ['documents'],
    customInvalidation: async (req, res, driverId) => {
      // Also invalidate the specific driver's documents cache
      const targetDriverId = req.params.driverId;
      if (targetDriverId && targetDriverId !== driverId) {
        const driverCacheManager = require('../utils/driverCache');
        await driverCacheManager.invalidateDriverCache(targetDriverId, 'documents');
      }
    }
  }),
  driverDocumentController.withdrawDocument
);

// Admin Document Review Routes (require admin role)
router.get('/admin/documents/pending',
  protect,
  normalizeDocumentQuery,
  ...driverDocumentValidation.getPendingDocuments,
  validate,
  adminDocumentController.getPendingDocuments
);

router.post('/admin/documents/:driverId/verify',
  protect,
  ...driverDocumentValidation.verifyDocuments,
  validate,
  clearDriverCacheMiddleware({ 
    dataTypes: ['documents'],
    customInvalidation: async (req, _res, _adminId) => {
      // Invalidate the specific driver's documents cache
      const driverId = req.params.driverId;
      const driverCacheManager = require('../utils/driverCache');
      await driverCacheManager.invalidateDriverCache(driverId, 'documents');
    }
  }),
  adminDocumentController.verifyDocuments
);

router.post('/admin/documents/:driverId/reject',
  protect,
  ...driverDocumentValidation.rejectDocuments,
  validate,
  clearDriverCacheMiddleware({ 
    dataTypes: ['documents'],
    customInvalidation: async (req, _res, _adminId) => {
      // Invalidate the specific driver's documents cache
      const driverId = req.params.driverId;
      const driverCacheManager = require('../utils/driverCache');
      await driverCacheManager.invalidateDriverCache(driverId, 'documents');
    }
  }),
  adminDocumentController.rejectDocuments
);

router.get('/admin/documents/statistics',
  protect,
  adminDocumentController.getDocumentStatistics
);

// Delete document route
router.delete('/admin/driver-documents/:documentId',
  protect,
  adminDocumentController.deleteDocument
);

module.exports = router;
const express = require('express');
const router = express.Router();
const driverDocumentController = require('../controllers/driverDocument.controller');
const adminDocumentController = require('../controllers/adminDocument.controller');
const { uploadDriverDocuments, handleUploadError } = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const driverDocumentValidation = require('../validations/driverDocument.validation');

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
  driverDocumentController.uploadDocuments
);

// Get current authenticated driver's documents (more secure)
router.get('/driver-documents/my',
  protect,
  driverDocumentController.getMyDocuments
);

// Get driver documents by ID (admin or specific driver access)
router.get('/driver-documents/:driverId',
  protect,
  ...driverDocumentValidation.getDriverDocuments,
  validate,
  driverDocumentController.getDriverDocuments
);

router.post('/driver-documents/:driverId/withdraw',
  protect,
  ...driverDocumentValidation.withdrawDocument,
  validate,
  driverDocumentController.withdrawDocument
);

// Admin Document Review Routes (require admin role)
router.get('/admin/documents/pending',
  protect,
  ...driverDocumentValidation.getPendingDocuments,
  validate,
  adminDocumentController.getPendingDocuments
);

router.post('/admin/documents/:driverId/verify',
  protect,
  ...driverDocumentValidation.verifyDocuments,
  validate,
  adminDocumentController.verifyDocuments
);

router.post('/admin/documents/:driverId/reject',
  protect,
  ...driverDocumentValidation.rejectDocuments,
  validate,
  adminDocumentController.rejectDocuments
);

router.get('/admin/documents/statistics',
  protect,
  adminDocumentController.getDocumentStatistics
);

module.exports = router;
const { body, param, query } = require('express-validator');

const driverDocumentValidation = {
  // Validation for document upload
  uploadDocuments: [
    // No additional validation needed - driver ID comes from JWT token
  ],

  // Validation for getting driver documents
  getDriverDocuments: [
    param('driverId')
      .notEmpty()
      .withMessage('Driver ID is required')
      .isUUID()
      .withMessage('Driver ID must be a valid UUID')
  ],

  // Validation for admin pending documents query
  getPendingDocuments: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['pending', 'verified', 'rejected'])
      .withMessage('Status must be one of: pending, verified, rejected'),
    query('search')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Search term must not exceed 100 characters')
      .trim()
  ],

  // Validation for document verification
  verifyDocuments: [
    param('driverId')
      .notEmpty()
      .withMessage('Driver ID is required')
      .isUUID()
      .withMessage('Driver ID must be a valid UUID'),
    body('verifiedBy')
      .optional()
      .isUUID()
      .withMessage('Verified by must be a valid UUID')
  ],

  // Validation for document rejection
  rejectDocuments: [
    param('driverId')
      .notEmpty()
      .withMessage('Driver ID is required')
      .isUUID()
      .withMessage('Driver ID must be a valid UUID'),
    body('rejectionReason')
      .notEmpty()
      .withMessage('Rejection reason is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Rejection reason must be between 10 and 500 characters')
      .trim(),
    body('rejectedBy')
      .optional()
      .isUUID()
      .withMessage('Rejected by must be a valid UUID')
  ],

  // Validation for document withdrawal
  withdrawDocument: [
    param('driverId')
      .notEmpty()
      .withMessage('Driver ID is required')
      .isUUID()
      .withMessage('Driver ID must be a valid UUID'),
    body('documentType')
      .notEmpty()
      .withMessage('Document type is required')
      .isIn(['drivingLicense', 'passportPhoto', 'vehicleRC', 'insurancePaper'])
      .withMessage('Document type must be one of: drivingLicense, passportPhoto, vehicleRC, insurancePaper')
  ]
};

module.exports = driverDocumentValidation;
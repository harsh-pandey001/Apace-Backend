const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const documentsDir = path.join(uploadsDir, 'documents');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fieldName = file.fieldname;
    const driverId = req.body.driverId || 'unknown';
    
    const filename = `${fieldName}-${driverId}-${uniqueSuffix}${fileExtension}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = {
    drivingLicense: ['application/pdf'],
    passportPhoto: ['image/jpeg', 'image/png', 'image/jpg'],
    vehicleRC: ['application/pdf'],
    insurancePaper: ['application/pdf']
  };

  const allowedTypes = allowedMimeTypes[file.fieldname];
  
  if (allowedTypes && allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Invalid file type for ${file.fieldname}. Expected: ${allowedTypes?.join(', ')}`);
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 4 // Maximum 4 files
  }
});

// Middleware for driver document upload
const uploadDriverDocuments = upload.fields([
  { name: 'drivingLicense', maxCount: 1 },
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'vehicleRC', maxCount: 1 },
  { name: 'insurancePaper', maxCount: 1 }
]);

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

module.exports = {
  uploadDriverDocuments,
  handleUploadError
};
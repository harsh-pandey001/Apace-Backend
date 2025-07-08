const { DriverDocument, Driver } = require('../models');
const fs = require('fs');
const path = require('path');

const driverDocumentController = {
  // Upload driver documents
  uploadDocuments: async (req, res) => {
    try {
      // Use authenticated driver's ID from JWT token
      const driverId = req.user.id;

      if (!driverId) {
        return res.status(400).json({
          success: false,
          message: 'Driver authentication required'
        });
      }

      // Check if driver exists
      const driver = await Driver.findByPk(driverId);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      // Check if driver documents already exist
      let driverDocument = await DriverDocument.findOne({
        where: { driver_id: driverId }
      });

      // Prepare document paths
      const documentPaths = {};
      if (req.files.drivingLicense) {
        documentPaths.driving_license_path = req.files.drivingLicense[0].path;
      }
      if (req.files.passportPhoto) {
        documentPaths.passport_photo_path = req.files.passportPhoto[0].path;
      }
      if (req.files.vehicleRC) {
        documentPaths.vehicle_rc_path = req.files.vehicleRC[0].path;
      }
      if (req.files.insurancePaper) {
        documentPaths.insurance_paper_path = req.files.insurancePaper[0].path;
      }

      if (Object.keys(documentPaths).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one document must be uploaded'
        });
      }

      if (driverDocument) {
        // Update existing document record
        // Remove old files if new ones are uploaded
        for (const [key] of Object.entries(documentPaths)) {
          const oldPath = driverDocument[key];
          if (oldPath && fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        await driverDocument.update({
          ...documentPaths,
          status: 'pending',
          rejection_reason: null,
          updated_at: new Date()
        });
      } else {
        // Create new document record
        driverDocument = await DriverDocument.create({
          driver_id: driverId,
          ...documentPaths,
          status: 'pending'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Documents uploaded successfully',
        data: {
          id: driverDocument.id,
          driver_id: driverDocument.driver_id,
          status: driverDocument.status,
          uploaded_documents: Object.keys(documentPaths),
          uploaded_at: driverDocument.uploaded_at
        }
      });

    } catch (error) {
      console.error('Upload documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload documents',
        error: error.message
      });
    }
  },

  // Get current authenticated driver's documents
  getMyDocuments: async (req, res) => {
    try {
      // Use authenticated driver's ID from JWT token
      const driverId = req.user.id;

      // Check if driver exists (should always exist since they're authenticated)
      const driver = await Driver.findByPk(driverId);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      // Get driver documents
      const driverDocument = await DriverDocument.findOne({
        where: { driver_id: driverId },
        include: [{
          model: Driver,
          as: 'driverProfile',
          attributes: ['id', 'name', 'email', 'phone']
        }]
      });

      if (!driverDocument) {
        return res.status(200).json({
          success: true,
          message: 'No documents found for this driver',
          data: {
            driver_id: driverId,
            driver: driver,
            status: 'not_uploaded',
            documents: {
              driving_license: { uploaded: false, path: null },
              passport_photo: { uploaded: false, path: null },
              vehicle_rc: { uploaded: false, path: null },
              insurance_paper: { uploaded: false, path: null }
            }
          }
        });
      }

      // Prepare response data
      const responseData = {
        id: driverDocument.id,
        driver_id: driverDocument.driver_id,
        driver: driverDocument.driverProfile,
        status: driverDocument.status,
        rejection_reason: driverDocument.rejection_reason,
        uploaded_at: driverDocument.uploaded_at,
        updated_at: driverDocument.updated_at,
        documents: {
          driving_license: {
            uploaded: !!driverDocument.driving_license_path,
            path: driverDocument.driving_license_path
          },
          passport_photo: {
            uploaded: !!driverDocument.passport_photo_path,
            path: driverDocument.passport_photo_path
          },
          vehicle_rc: {
            uploaded: !!driverDocument.vehicle_rc_path,
            path: driverDocument.vehicle_rc_path
          },
          insurance_paper: {
            uploaded: !!driverDocument.insurance_paper_path,
            path: driverDocument.insurance_paper_path
          }
        }
      };

      res.status(200).json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('Get my documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve driver documents',
        error: error.message
      });
    }
  },

  // Get driver documents and status
  getDriverDocuments: async (req, res) => {
    try {
      const { driverId } = req.params;

      // Check if driver exists
      const driver = await Driver.findByPk(driverId);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      // Get driver documents
      const driverDocument = await DriverDocument.findOne({
        where: { driver_id: driverId },
        include: [{
          model: Driver,
          as: 'driverProfile',
          attributes: ['id', 'name', 'email', 'phone']
        }]
      });

      if (!driverDocument) {
        return res.status(404).json({
          success: false,
          message: 'No documents found for this driver'
        });
      }

      // Prepare response data
      const responseData = {
        id: driverDocument.id,
        driver_id: driverDocument.driver_id,
        driver: driverDocument.driverProfile,
        status: driverDocument.status,
        rejection_reason: driverDocument.rejection_reason,
        uploaded_at: driverDocument.uploaded_at,
        updated_at: driverDocument.updated_at,
        documents: {
          driving_license: {
            uploaded: !!driverDocument.driving_license_path,
            path: driverDocument.driving_license_path
          },
          passport_photo: {
            uploaded: !!driverDocument.passport_photo_path,
            path: driverDocument.passport_photo_path
          },
          vehicle_rc: {
            uploaded: !!driverDocument.vehicle_rc_path,
            path: driverDocument.vehicle_rc_path
          },
          insurance_paper: {
            uploaded: !!driverDocument.insurance_paper_path,
            path: driverDocument.insurance_paper_path
          }
        }
      };

      res.status(200).json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('Get driver documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve driver documents',
        error: error.message
      });
    }
  },

  // Withdraw a specific document
  withdrawDocument: async (req, res) => {
    try {
      const { driverId } = req.params;
      const { documentType } = req.body;
      const requestingUserId = req.user?.id;

      // Validate document type
      const validDocumentTypes = ['drivingLicense', 'passportPhoto', 'vehicleRC', 'insurancePaper'];
      if (!documentType || !validDocumentTypes.includes(documentType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document type. Valid options: drivingLicense, passportPhoto, vehicleRC, insurancePaper'
        });
      }

      // Check if driver exists
      const driver = await Driver.findByPk(driverId);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      // Verify that the requesting user is the driver (JWT validation)
      if (requestingUserId !== driverId) {
        return res.status(403).json({
          success: false,
          message: 'You can only withdraw your own documents'
        });
      }

      // Get driver documents
      const driverDocument = await DriverDocument.findOne({
        where: { driver_id: driverId }
      });

      if (!driverDocument) {
        return res.status(404).json({
          success: false,
          message: 'No documents found for this driver'
        });
      }

      // Map document types to database fields
      const documentFieldMap = {
        drivingLicense: 'driving_license_path',
        passportPhoto: 'passport_photo_path',
        vehicleRC: 'vehicle_rc_path',
        insurancePaper: 'insurance_paper_path'
      };

      const documentField = documentFieldMap[documentType];
      const currentDocumentPath = driverDocument[documentField];

      // Check if document exists
      if (!currentDocumentPath) {
        return res.status(400).json({
          success: false,
          message: `${documentType} has not been uploaded yet`
        });
      }

      // Optional: Prevent withdrawal if document is already verified
      // Uncomment the following lines if you want to prevent withdrawal of verified documents
      /*
      if (driverDocument.status === 'verified') {
        return res.status(400).json({
          success: false,
          message: 'Cannot withdraw documents that have already been verified'
        });
      }
      */

      // Remove the physical file if it exists
      if (fs.existsSync(currentDocumentPath)) {
        try {
          fs.unlinkSync(currentDocumentPath);
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
          // Continue with database update even if file deletion fails
        }
      }

      // Update the document record - clear only the specific document
      const updateData = {
        [documentField]: null,
        updated_at: new Date()
      };

      // Check if this was the last document - if so, reset status
      const remainingDocuments = [
        driverDocument.driving_license_path,
        driverDocument.passport_photo_path,
        driverDocument.vehicle_rc_path,
        driverDocument.insurance_paper_path
      ].filter(docPath => docPath && docPath !== currentDocumentPath);

      if (remainingDocuments.length === 0) {
        // If no documents remain, reset all status fields
        updateData.status = 'pending';
        updateData.rejection_reason = null;
        updateData.verified_at = null;
        updateData.rejected_at = null;
        updateData.verified_by = null;
        updateData.rejected_by = null;
      }

      await driverDocument.update(updateData);

      res.status(200).json({
        success: true,
        message: `${documentType} has been withdrawn successfully`,
        data: {
          withdrawnDocument: documentType,
          remainingDocuments: remainingDocuments.length,
          newStatus: updateData.status || driverDocument.status
        }
      });

    } catch (error) {
      console.error('Withdraw document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to withdraw document',
        error: error.message
      });
    }
  }
};

module.exports = driverDocumentController;
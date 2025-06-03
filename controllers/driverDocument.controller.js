const { DriverDocument, User } = require('../models');
const fs = require('fs');

const driverDocumentController = {
  // Upload driver documents
  uploadDocuments: async (req, res) => {
    try {
      const { driverId } = req.body;

      if (!driverId) {
        return res.status(400).json({
          success: false,
          message: 'Driver ID is required'
        });
      }

      // Check if driver exists
      const driver = await User.findByPk(driverId);
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

  // Get driver documents and status
  getDriverDocuments: async (req, res) => {
    try {
      const { driverId } = req.params;

      // Check if driver exists
      const driver = await User.findByPk(driverId);
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
          model: User,
          as: 'driver',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
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
        driver: driverDocument.driver,
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
  }
};

module.exports = driverDocumentController;
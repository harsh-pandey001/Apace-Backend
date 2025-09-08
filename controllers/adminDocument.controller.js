const { DriverDocument, /* User, */ Driver } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
// const path = require('path'); // Unused

const adminDocumentController = {
  // Get all documents for admin review (show all by default)
  getPendingDocuments: async (req, res) => {
    try {
      let { page = 1, limit = 10, status, search } = req.query;
      const offset = (page - 1) * limit;

      // Normalize empty status to undefined to show all documents
      if (status === '' || status === null || status === undefined) {
        status = undefined;
      }

      const whereClause = {};
      if (status && ['pending', 'verified', 'rejected'].includes(status)) {
        whereClause.status = status;
      }

      // Search functionality
      let driverWhere = {};
      if (search) {
        const searchTerm = search.toLowerCase();
        driverWhere = {
          [Op.or]: [
            { name: { [Op.like]: `%${searchTerm}%` } },
            { email: { [Op.like]: `%${searchTerm}%` } },
            { phone: { [Op.like]: `%${searchTerm}%` } }
          ]
        };
      }

      const { count, rows: documents } = await DriverDocument.findAndCountAll({
        where: whereClause,
        include: [{
          model: Driver,
          as: 'driverProfile',
          attributes: ['id', 'name', 'email', 'phone', 'isActive', 'isVerified', 'vehicleType'],
          where: driverWhere,
          required: false // Left join to include records even if driver is deleted
        }],
        order: [['uploaded_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      // Format response data
      const formattedDocuments = documents.map(doc => ({
        id: doc.id,
        driver: doc.driverProfile || {
          // Ghost mode for deleted drivers
          id: doc.driver_id,
          name: 'Deleted Driver',
          email: null,
          phone: null,
          isActive: false,
          isVerified: false,
          vehicleType: null,
          deleted: true
        },
        status: doc.status,
        rejection_reason: doc.rejection_reason,
        uploaded_at: doc.uploaded_at,
        updated_at: doc.updated_at,
        documents: {
          driving_license: {
            uploaded: !!doc.driving_license_path,
            path: doc.driving_license_path,
            status: doc.driving_license_status || 'pending'
          },
          passport_photo: {
            uploaded: !!doc.passport_photo_path,
            path: doc.passport_photo_path,
            status: doc.passport_photo_status || 'pending'
          },
          vehicle_rc: {
            uploaded: !!doc.vehicle_rc_path,
            path: doc.vehicle_rc_path,
            status: doc.vehicle_rc_status || 'pending'
          },
          insurance_paper: {
            uploaded: !!doc.insurance_paper_path,
            path: doc.insurance_paper_path,
            status: doc.insurance_paper_status || 'pending'
          }
        }
      }));

      res.status(200).json({
        success: true,
        data: {
          documents: formattedDocuments,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_count: count,
            per_page: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Get pending documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pending documents',
        error: error.message
      });
    }
  },

  // Verify driver documents
  verifyDocuments: async (req, res) => {
    try {
      const { driverId } = req.params;
      const { verifiedBy } = req.body;

      // Check if driver exists
      const driver = await Driver.findByPk(driverId);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found'
        });
      }

      // Find driver documents
      const driverDocument = await DriverDocument.findOne({
        where: { driver_id: driverId }
      });

      if (!driverDocument) {
        return res.status(404).json({
          success: false,
          message: 'No documents found for this driver'
        });
      }

      if (driverDocument.status === 'verified') {
        return res.status(400).json({
          success: false,
          message: 'Documents are already verified'
        });
      }

      // Update document status to verified
      await driverDocument.update({
        status: 'verified',
        rejection_reason: null,
        updated_at: new Date()
      });

      // Also update the driver's isVerified status
      await driver.update({
        isVerified: true
      });

      res.status(200).json({
        success: true,
        message: 'Documents verified successfully',
        data: {
          id: driverDocument.id,
          driver_id: driverDocument.driver_id,
          status: driverDocument.status,
          verified_at: driverDocument.updated_at,
          verified_by: verifiedBy || req.user?.id
        }
      });

    } catch (error) {
      console.error('Verify documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify documents',
        error: error.message
      });
    }
  },

  // Reject driver documents
  rejectDocuments: async (req, res) => {
    try {
      const { driverId } = req.params;
      const { rejectionReason, rejectedBy } = req.body;

      if (!rejectionReason || rejectionReason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
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

      // Find driver documents
      const driverDocument = await DriverDocument.findOne({
        where: { driver_id: driverId }
      });

      if (!driverDocument) {
        return res.status(404).json({
          success: false,
          message: 'No documents found for this driver'
        });
      }

      if (driverDocument.status === 'rejected') {
        return res.status(400).json({
          success: false,
          message: 'Documents are already rejected'
        });
      }

      // Update document status to rejected
      await driverDocument.update({
        status: 'rejected',
        rejection_reason: rejectionReason.trim(),
        updated_at: new Date()
      });

      // Also update the driver's isVerified status
      await driver.update({
        isVerified: false
      });

      res.status(200).json({
        success: true,
        message: 'Documents rejected successfully',
        data: {
          id: driverDocument.id,
          driver_id: driverDocument.driver_id,
          status: driverDocument.status,
          rejection_reason: driverDocument.rejection_reason,
          rejected_at: driverDocument.updated_at,
          rejected_by: rejectedBy || req.user?.id
        }
      });

    } catch (error) {
      console.error('Reject documents error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject documents',
        error: error.message
      });
    }
  },

  // Get document statistics for admin dashboard
  getDocumentStatistics: async (req, res) => {
    try {
      const totalDocuments = await DriverDocument.count();
      const pendingDocuments = await DriverDocument.count({
        where: { status: 'pending' }
      });
      const verifiedDocuments = await DriverDocument.count({
        where: { status: 'verified' }
      });
      const rejectedDocuments = await DriverDocument.count({
        where: { status: 'rejected' }
      });

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUploads = await DriverDocument.count({
        where: {
          uploaded_at: {
            [Op.gte]: thirtyDaysAgo
          }
        }
      });

      const recentVerifications = await DriverDocument.count({
        where: {
          status: 'verified',
          updated_at: {
            [Op.gte]: thirtyDaysAgo
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          total_documents: totalDocuments,
          pending_documents: pendingDocuments,
          verified_documents: verifiedDocuments,
          rejected_documents: rejectedDocuments,
          recent_activity: {
            uploads_last_30_days: recentUploads,
            verifications_last_30_days: recentVerifications
          },
          verification_rate: totalDocuments > 0 ? 
            ((verifiedDocuments / totalDocuments) * 100).toFixed(2) : 0
        }
      });

    } catch (error) {
      console.error('Get document statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve document statistics',
        error: error.message
      });
    }
  },

  // Delete a specific document
  deleteDocument: async (req, res) => {
    try {
      const { documentId } = req.params;

      // Find the document
      const document = await DriverDocument.findByPk(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Helper function to delete file from storage
      const deleteFile = (filePath) => {
        if (filePath && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            // File deleted successfully
          } catch (error) {
            console.error(`Error deleting file ${filePath}:`, error);
          }
        }
      };

      // Delete associated files
      if (document.driving_license_path) {
        deleteFile(document.driving_license_path);
      }
      if (document.passport_photo_path) {
        deleteFile(document.passport_photo_path);
      }
      if (document.vehicle_rc_path) {
        deleteFile(document.vehicle_rc_path);
      }
      if (document.insurance_paper_path) {
        deleteFile(document.insurance_paper_path);
      }

      // Delete the document record
      await document.destroy();

      // Update driver verification status after deletion
      const driver = await Driver.findByPk(document.driver_id);
      if (driver) {
        await driver.update({
          isVerified: false
        });
      }

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
        data: {
          id: documentId,
          driver_id: document.driver_id
        }
      });

    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  },

  // Auto-verification logic based on individual document approvals
  checkAndUpdateDriverVerification: async (driverId) => {
    try {
      const driverDocument = await DriverDocument.findOne({
        where: { driver_id: driverId }
      });

      if (!driverDocument) {
        return false;
      }

      // Check if all 4 documents are verified
      const allDocumentsVerified = 
        driverDocument.driving_license_status === 'verified' &&
        driverDocument.passport_photo_status === 'verified' &&
        driverDocument.vehicle_rc_status === 'verified' &&
        driverDocument.insurance_paper_status === 'verified';

      // Update driver verification status
      const driver = await Driver.findByPk(driverId);
      if (driver) {
        await driver.update({
          isVerified: allDocumentsVerified
        });
      }

      return allDocumentsVerified;
    } catch (error) {
      console.error('Auto-verification check error:', error);
      return false;
    }
  }
};

module.exports = adminDocumentController;
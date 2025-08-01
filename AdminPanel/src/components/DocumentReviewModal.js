import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import DocumentStatusChip from './DocumentStatusChip';
import DocumentPreviewModal from './DocumentPreviewModal';
import driverDocumentService from '../services/driverDocumentService';

const REJECTION_REASONS = [
  "Driving license image is blurry and unreadable.",
  "Passport photo does not meet requirements - face not clearly visible.",
  "Vehicle RC document has expired. Please upload current registration.",
  "Insurance paper shows policy has lapsed. Please provide valid insurance.",
  "Document format is not acceptable. Please upload PDF for documents and JPG/PNG for photos.",
  "Document appears to be fraudulent or tampered with."
];

const DocumentReviewModal = ({ 
  open, 
  onClose, 
  document, 
  onStatusUpdate,
  showSnackbar 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');
  const [previewModal, setPreviewModal] = useState({
    open: false,
    documentPath: null,
    documentType: null,
    documentName: null
  });

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await driverDocumentService.verifyDocuments(
        document.driver.id,
        user?.id
      );
      
      showSnackbar('Documents verified successfully', 'success');
      onStatusUpdate(document.id, 'verified', result.data);
      onClose();
    } catch (error) {
      console.error('Error approving documents:', error);
      setError(error.response?.data?.message || 'Failed to approve documents');
      showSnackbar('Failed to approve documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const finalReason = customReason.trim() || selectedReason;
    
    if (!finalReason) {
      setError('Please select or enter a rejection reason');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await driverDocumentService.rejectDocuments(
        document.driver.id,
        finalReason,
        user?.id
      );
      
      showSnackbar('Documents rejected successfully', 'success');
      onStatusUpdate(document.id, 'rejected', result.data);
      onClose();
    } catch (error) {
      console.error('Error rejecting documents:', error);
      setError(error.response?.data?.message || 'Failed to reject documents');
      showSnackbar('Failed to reject documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentIcon = (docType) => {
    return docType === 'passport_photo' ? <ImageIcon /> : <DocumentIcon />;
  };

  const handlePreviewDocument = (documentPath, docType, docName) => {
    setPreviewModal({
      open: true,
      documentPath,
      documentType: docType === 'passport_photo' ? 'image/jpeg' : 'application/pdf',
      documentName: docName
    });
  };

  const handleClosePreview = () => {
    setPreviewModal({
      open: false,
      documentPath: null,
      documentType: null,
      documentName: null
    });
  };

  const handleDownload = (documentPath, documentName) => {
    if (documentPath) {
      const filename = documentPath.split('/').pop();
      const url = `${process.env.REACT_APP_API_BASE_URL || 'https://apace-backend-86500976134.us-central1.run.app'}/uploads/documents/${filename}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAction(null);
      setSelectedReason('');
      setCustomReason('');
      setError('');
      onClose();
    }
  };

  const renderDocumentList = () => {
    const docs = document?.documents || {};
    const documentTypes = [
      { key: 'driving_license', label: 'Driving License' },
      { key: 'passport_photo', label: 'Passport Photo' },
      { key: 'vehicle_rc', label: 'Vehicle RC' },
      { key: 'insurance_paper', label: 'Insurance Paper' }
    ];

    return (
      <Grid container spacing={2}>
        {documentTypes.map(({ key, label }) => (
          <Grid item xs={12} sm={6} key={key}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    {getDocumentIcon(key)}
                    <Typography variant="body2" fontWeight={500}>
                      {label}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    {docs[key]?.uploaded ? (
                      <>
                        <Chip 
                          label="Uploaded" 
                          color="success" 
                          size="small" 
                          variant="outlined"
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => handlePreviewDocument(docs[key].path, key, label)}
                          title="Preview"
                          color="primary"
                        >
                          <PreviewIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDownload(docs[key].path, label)}
                          title="Download"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <Chip 
                        label="Not Uploaded" 
                        color="error" 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  if (!document) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Review Driver Documents
          </Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Driver Information */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Driver Information
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {document.driver?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">
                    {document.driver?.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">
                    {document.driver?.phone}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Current Status</Typography>
                  <DocumentStatusChip status={document.status} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        {/* Documents */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Uploaded Documents
          </Typography>
          {renderDocumentList()}
        </Box>

        {/* Rejection Reason (if status is rejected) */}
        {document.status === 'rejected' && document.rejection_reason && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Rejection Reason
            </Typography>
            <Alert severity="error">
              {document.rejection_reason}
            </Alert>
          </Box>
        )}

        {/* Action Selection */}
        {document.status === 'pending' && !action && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Action
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                color="success"
                onClick={() => setAction('approve')}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : null}
              >
                Approve Documents
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => setAction('reject')}
                disabled={loading}
              >
                Reject Documents
              </Button>
            </Box>
          </Box>
        )}

        {/* Rejection Form */}
        {action === 'reject' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Rejection Details
            </Typography>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Select Rejection Reason</InputLabel>
              <Select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                label="Select Rejection Reason"
              >
                {REJECTION_REASONS.map((reason, index) => (
                  <MenuItem key={index} value={reason}>
                    {reason}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Other reason (optional)"
              placeholder="Enter custom rejection reason if none of the above options apply..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              margin="normal"
              helperText="This will override the selected reason above if provided"
            />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        
        {action === 'approve' && (
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            Confirm Approval
          </Button>
        )}
        
        {action === 'reject' && (
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={loading || (!selectedReason && !customReason.trim())}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            Confirm Rejection
          </Button>
        )}
      </DialogActions>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={previewModal.open}
        onClose={handleClosePreview}
        documentPath={previewModal.documentPath}
        documentType={previewModal.documentType}
        documentName={previewModal.documentName}
      />
    </Dialog>
  );
};

export default DocumentReviewModal;
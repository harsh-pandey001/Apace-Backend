import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilePresent as DocumentIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Preview as PreviewIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import DocumentStatusChip from '../components/DocumentStatusChip';
import DocumentReviewModal from '../components/DocumentReviewModal';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import driverDocumentService from '../services/driverDocumentService';

const DriverDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState(''); // Show all by default
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [previewModal, setPreviewModal] = useState({
    open: false,
    documentPath: null,
    documentType: null,
    documentName: null
  });
  
  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    documentId: null,
    driverName: null
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      // Use the service method which now properly handles optional status and search
      const response = await driverDocumentService.getPendingDocuments(
        page + 1,
        rowsPerPage,
        statusFilter || null,
        searchTerm || null
      );
      
      setDocuments(response.data.documents || []);
      setTotalCount(response.data.pagination?.total_count || 0);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showSnackbar('Failed to fetch documents', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, searchTerm]);

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await driverDocumentService.getDocumentStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setModalOpen(true);
  };

  const handleStatusUpdate = (documentId, newStatus, updatedData) => {
    setDocuments(prevDocs => 
      prevDocs.map(doc => 
        doc.id === documentId 
          ? { ...doc, status: newStatus, ...updatedData }
          : doc
      )
    );
    
    // Refresh statistics
    fetchStatistics();
  };

  const handleQuickAction = async (document, action) => {
    try {
      if (action === 'approve') {
        await driverDocumentService.verifyDocuments(document.driver.id);
        showSnackbar('Documents approved successfully', 'success');
        handleStatusUpdate(document.id, 'verified', {});
      } else if (action === 'reject') {
        // For quick reject, use a default reason
        await driverDocumentService.rejectDocuments(
          document.driver.id,
          'Documents require review. Please resubmit with better quality.'
        );
        showSnackbar('Documents rejected successfully', 'success');
        handleStatusUpdate(document.id, 'rejected', {});
      }
    } catch (error) {
      console.error(`Error ${action}ing document:`, error);
      showSnackbar(`Failed to ${action} documents`, 'error');
    }
  };

  const getUploadedDocumentsCount = (documents) => {
    if (!documents) return 0;
    return Object.values(documents).filter(doc => doc?.uploaded).length;
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

  // Handle delete document
  const handleDeleteDocument = async (documentId, driverName) => {
    setDeleteDialog({
      open: true,
      documentId,
      driverName
    });
  };

  const confirmDeleteDocument = async () => {
    if (!deleteDialog.documentId) return;
    
    setDeleteLoading(true);
    try {
      await driverDocumentService.deleteDocument(deleteDialog.documentId);
      showSnackbar('Document deleted successfully', 'success');
      
      // Refresh documents and statistics
      fetchDocuments();
      fetchStatistics();
      
      setDeleteDialog({
        open: false,
        documentId: null,
        driverName: null
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      showSnackbar('Failed to delete document', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDeleteDocument = () => {
    setDeleteDialog({
      open: false,
      documentId: null,
      driverName: null
    });
  };

  // No need for client-side filtering since we're doing server-side filtering
  const filteredDocuments = documents;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Driver Document Verification
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchDocuments();
            fetchStatistics();
          }}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Documents
                </Typography>
                <Typography variant="h4" component="div">
                  {statistics.total_documents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Pending Review
                </Typography>
                <Typography variant="h4" component="div" color="warning.main">
                  {statistics.pending_documents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Verified
                </Typography>
                <Typography variant="h4" component="div" color="success.main">
                  {statistics.verified_documents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Rejected
                </Typography>
                <Typography variant="h4" component="div" color="error.main">
                  {statistics.rejected_documents}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Status Filter"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by driver name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Documents Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Driver</TableCell>
                <TableCell>Documents</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Uploaded Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No documents found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((document) => (
                  <TableRow key={document.id} hover>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight={500}>
                            {document.driver?.deleted ? 'Deleted Driver' : 
                             (document.driver?.name || 'N/A')}
                          </Typography>
                          {document.driver?.deleted && (
                            <Chip 
                              label="Deleted" 
                              size="small" 
                              color="default"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {document.driver?.email || 'N/A'}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {document.driver?.phone || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DocumentIcon color="primary" />
                        <Typography variant="body2">
                          {getUploadedDocumentsCount(document.documents)}/4 uploaded
                        </Typography>
                      </Box>
                      <Box display="flex" gap={0.5} mt={1} flexWrap="wrap">
                        {/* Driving License */}
                        {document.documents?.driving_license?.uploaded ? (
                          <Chip 
                            label="DL"
                            size="small"
                            color={document.documents.driving_license.status === 'verified' ? 'success' : 
                                   document.documents.driving_license.status === 'rejected' ? 'error' : 'warning'}
                            variant="filled"
                            clickable
                            onClick={() => handlePreviewDocument(
                              document.documents.driving_license.path, 
                              'driving_license', 
                              'Driving License'
                            )}
                            icon={<PreviewIcon />}
                          />
                        ) : (
                          <Chip label="DL" size="small" variant="outlined" disabled />
                        )}
                        
                        {/* Passport Photo */}
                        {document.documents?.passport_photo?.uploaded ? (
                          <Chip 
                            label="Photo"
                            size="small"
                            color={document.documents.passport_photo.status === 'verified' ? 'success' : 
                                   document.documents.passport_photo.status === 'rejected' ? 'error' : 'warning'}
                            variant="filled"
                            clickable
                            onClick={() => handlePreviewDocument(
                              document.documents.passport_photo.path, 
                              'passport_photo', 
                              'Passport Photo'
                            )}
                            icon={<PreviewIcon />}
                          />
                        ) : (
                          <Chip label="Photo" size="small" variant="outlined" disabled />
                        )}
                        
                        {/* Vehicle RC */}
                        {document.documents?.vehicle_rc?.uploaded ? (
                          <Chip 
                            label="RC"
                            size="small"
                            color={document.documents.vehicle_rc.status === 'verified' ? 'success' : 
                                   document.documents.vehicle_rc.status === 'rejected' ? 'error' : 'warning'}
                            variant="filled"
                            clickable
                            onClick={() => handlePreviewDocument(
                              document.documents.vehicle_rc.path, 
                              'vehicle_rc', 
                              'Vehicle RC'
                            )}
                            icon={<PreviewIcon />}
                          />
                        ) : (
                          <Chip label="RC" size="small" variant="outlined" disabled />
                        )}
                        
                        {/* Insurance Paper */}
                        {document.documents?.insurance_paper?.uploaded ? (
                          <Chip 
                            label="Insurance"
                            size="small"
                            color={document.documents.insurance_paper.status === 'verified' ? 'success' : 
                                   document.documents.insurance_paper.status === 'rejected' ? 'error' : 'warning'}
                            variant="filled"
                            clickable
                            onClick={() => handlePreviewDocument(
                              document.documents.insurance_paper.path, 
                              'insurance_paper', 
                              'Insurance Paper'
                            )}
                            icon={<PreviewIcon />}
                          />
                        ) : (
                          <Chip label="Insurance" size="small" variant="outlined" disabled />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <DocumentStatusChip status={document.status} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(document.uploaded_at), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(document.uploaded_at), 'HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDocument(document)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {document.status === 'pending' && (
                          <>
                            <Tooltip title="Quick Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleQuickAction(document, 'approve')}
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Quick Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleQuickAction(document, 'reject')}
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        <Tooltip title="Delete Document">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteDocument(
                              document.id,
                              document.driver?.deleted ? 'Deleted Driver' : 
                              (document.driver?.name || 'N/A')
                            )}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      {/* Document Review Modal */}
      <DocumentReviewModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        document={selectedDocument}
        onStatusUpdate={handleStatusUpdate}
        showSnackbar={showSnackbar}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        open={previewModal.open}
        onClose={handleClosePreview}
        documentPath={previewModal.documentPath}
        documentType={previewModal.documentType}
        documentName={previewModal.documentName}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={cancelDeleteDocument}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon />
          Delete Document
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all documents for{' '}
            <strong>{deleteDialog.driverName}</strong>?
            <br /><br />
            <strong>⚠️ WARNING:</strong> This action cannot be undone. All uploaded documents and files will be permanently removed from the system.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteDocument} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteDocument}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Document'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DriverDocuments;
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';

const DocumentPreviewModal = ({ 
  open, 
  onClose, 
  documentPath, 
  documentType, 
  documentName 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reset loading state when modal opens or document changes
  useEffect(() => {
    if (open && documentPath) {
      setLoading(true);
      setError(null);
    }
  }, [open, documentPath]);

  // Get the full URL for the document
  const getDocumentUrl = () => {
    if (!documentPath) return null;
    // Remove the full path and create a proper API URL
    const filename = documentPath.split('/').pop();
    return `http://localhost:5000/uploads/documents/${filename}`;
  };

  const handleDownload = () => {
    const url = getDocumentUrl();
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90) % 360);
  };

  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetView = () => {
    setZoom(100);
    setRotation(0);
    setIsFullscreen(false);
  };

  const handleClose = () => {
    resetView();
    setError(null);
    onClose();
  };

  const isPDF = documentType?.toLowerCase().includes('pdf') || documentPath?.toLowerCase().includes('.pdf');
  const isImage = documentType?.toLowerCase().includes('image') || 
                  documentPath?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) ||
                  documentType === 'image/jpeg' || documentType === 'image/png';

  const documentUrl = getDocumentUrl();

  const renderImagePreview = () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        maxHeight: isFullscreen ? '80vh' : '60vh',
        overflow: 'auto',
        backgroundColor: '#f5f5f5',
        borderRadius: 1,
        p: 2,
        position: 'relative'
      }}
    >
      {loading && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          sx={{ transform: 'translate(-50%, -50%)' }}
        >
          <CircularProgress />
        </Box>
      )}
      <img
        src={documentUrl}
        alt={documentName}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
          transition: 'transform 0.3s ease',
          borderRadius: '4px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          display: loading ? 'none' : 'block'
        }}
        onLoad={() => {
          setLoading(false);
          setError(null);
        }}
        onError={() => {
          setLoading(false);
          setError('Failed to load image. Please check if the file exists and try downloading instead.');
        }}
      />
    </Box>
  );

  const renderPDFPreview = () => (
    <Box
      sx={{
        minHeight: '400px',
        maxHeight: isFullscreen ? '80vh' : '60vh',
        backgroundColor: '#f5f5f5',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <iframe
        src={`${documentUrl}#toolbar=1&navpanes=1&scrollbar=1`}
        width="100%"
        height="100%"
        style={{
          border: 'none',
          minHeight: isFullscreen ? '70vh' : '500px',
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left'
        }}
        title={documentName}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError('Failed to load PDF');
        }}
      />
    </Box>
  );

  const renderUnsupportedFormat = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        textAlign: 'center',
        p: 3
      }}
    >
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Preview not available
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        This file format cannot be previewed in the browser.
      </Typography>
      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={handleDownload}
      >
        Download to View
      </Button>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={isFullscreen ? false : 'lg'}
      fullWidth
      fullScreen={isFullscreen}
      PaperProps={{
        sx: {
          minHeight: isFullscreen ? '100vh' : '600px',
          maxHeight: isFullscreen ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" noWrap>
              {documentName || 'Document Preview'}
            </Typography>
            {documentType && (
              <Chip 
                label={documentType.toUpperCase()} 
                size="small" 
                variant="outlined" 
              />
            )}
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {/* Zoom Controls */}
            {(isPDF || isImage) && (
              <>
                <IconButton size="small" onClick={handleZoomOut} title="Zoom Out">
                  <ZoomOutIcon />
                </IconButton>
                <Typography variant="caption" sx={{ minWidth: '40px', textAlign: 'center' }}>
                  {zoom}%
                </Typography>
                <IconButton size="small" onClick={handleZoomIn} title="Zoom In">
                  <ZoomInIcon />
                </IconButton>
              </>
            )}
            
            {/* Rotation Controls (Image only) */}
            {isImage && (
              <>
                <IconButton size="small" onClick={handleRotateLeft} title="Rotate Left">
                  <RotateLeftIcon />
                </IconButton>
                <IconButton size="small" onClick={handleRotateRight} title="Rotate Right">
                  <RotateRightIcon />
                </IconButton>
              </>
            )}
            
            {/* Fullscreen Toggle */}
            <IconButton size="small" onClick={toggleFullscreen} title="Toggle Fullscreen">
              <FullscreenIcon />
            </IconButton>
            
            {/* Download Button */}
            <IconButton size="small" onClick={handleDownload} title="Download">
              <DownloadIcon />
            </IconButton>
            
            {/* Close Button */}
            <IconButton onClick={handleClose} title="Close">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box p={3}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
            >
              Download File Instead
            </Button>
          </Box>
        )}

        {!loading && !error && documentUrl && (
          <>
            {isPDF && renderPDFPreview()}
            {isImage && renderImagePreview()}
            {!isPDF && !isImage && renderUnsupportedFormat()}
          </>
        )}

        {!documentUrl && !loading && (
          <Box p={3}>
            <Alert severity="warning">
              Document path is not available for preview.
            </Alert>
          </Box>
        )}
      </DialogContent>

      {!isFullscreen && (
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={resetView} variant="outlined">
            Reset View
          </Button>
          <Button onClick={handleDownload} variant="contained" startIcon={<DownloadIcon />}>
            Download
          </Button>
          <Button onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default DocumentPreviewModal;
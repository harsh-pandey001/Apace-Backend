// Middleware to normalize query parameters
const normalizeDocumentQuery = (req, res, next) => {
  // Normalize empty status parameter to undefined
  if (req.query.status === '') {
    delete req.query.status;
  }
  
  // Normalize empty search parameter to undefined
  if (req.query.search === '') {
    delete req.query.search;
  }
  
  next();
};

module.exports = {
  normalizeDocumentQuery
};
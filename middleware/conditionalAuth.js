const { protect } = require('./auth');

// Middleware that conditionally applies authentication based on userType in request body
const conditionalProtect = (req, res, next) => {
  // Check if userType is 'guest' - if so, skip authentication
  if (req.body && req.body.userType === 'guest') {
    return next();
  }
  
  // For authenticated users or when userType is not specified, apply authentication
  return protect(req, res, next);
};

module.exports = { conditionalProtect };
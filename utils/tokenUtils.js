const jwt = require('jsonwebtoken');

/*
 * Normalize expiration time to proper JWT format - UNUSED
 * @param {string} expiry - Expiration time (could be seconds or JWT format)
 * @returns {string|number} Normalized expiration
 */
/*
const normalizeExpiry = (expiry) => {
  // If it's already a JWT format (contains letters), return as-is
  if (/[a-zA-Z]/.test(expiry)) {
    return expiry;
  }
  
  // If it's a string of numbers, convert common values to proper format
  if (typeof expiry === 'string' && /^\d+$/.test(expiry)) {
    const seconds = parseInt(expiry, 10);
    if (seconds === 86400) return '24h';      // 24 hours
    if (seconds === 604800) return '7d';     // 7 days
    if (seconds === 3600) return '1h';       // 1 hour
    if (seconds === 1800) return '30m';      // 30 minutes
    // For other values, return as number (seconds)
    return seconds;
  }
  
  // If it's a number, return as-is (will be interpreted as seconds)
  if (typeof expiry === 'number') {
    return expiry;
  }
  
  // Fallback to default
  return '1h';
};
*/

/**
 * Generate a JWT token for a user
 * @param {string} id - User ID to encode in the token
 * @returns {string} JWT token
 */
exports.signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};

/**
 * Generate a refresh token for a user
 * @param {string} id - User ID to encode in the token
 * @returns {string} Refresh token
 */
exports.signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
};

/**
 * Create tokens and send response
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 */
exports.createSendTokens = (user, statusCode, res) => {
  const token = this.signToken(user.id);
  const refreshToken = this.signRefreshToken(user.id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    refreshToken,
    data: {
      user
    }
  });
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify a refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
exports.verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
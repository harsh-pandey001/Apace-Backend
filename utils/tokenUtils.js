const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for a user
 * @param {string} id - User ID to encode in the token
 * @returns {string} JWT token
 */
exports.signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

/**
 * Generate a refresh token for a user
 * @param {string} id - User ID to encode in the token
 * @returns {string} Refresh token
 */
exports.signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
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
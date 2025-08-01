const { body } = require('express-validator');

exports.updateDriverStatusValidation = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['online', 'offline'])
    .withMessage('Invalid status. Must be "online" or "offline"')
];
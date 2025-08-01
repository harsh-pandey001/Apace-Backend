// Middleware to map frontend field names to backend expected field names
const mapGuestShipmentFields = (req, res, next) => {
  // Map estimatedWeight to weight if estimatedWeight is provided
  if (req.body.estimatedWeight !== undefined && req.body.weight === undefined) {
    req.body.weight = req.body.estimatedWeight;
  }
  
  // Keep the original field for logging/debugging
  if (req.body.estimatedWeight !== undefined) {
    req.body._originalEstimatedWeight = req.body.estimatedWeight;
  }
  
  next();
};

module.exports = { mapGuestShipmentFields };
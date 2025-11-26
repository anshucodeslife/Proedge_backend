const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

/**
 * Sanitize request data
 */
function sanitizeMiddleware(req, res, next) {
  // Sanitize req.body, req.query, and req.params
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.query);
  mongoSanitize.sanitize(req.params);
  
  next();
}

module.exports = {
  sanitizeMiddleware,
  xss,
  mongoSanitize,
};

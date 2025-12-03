/**
 * Custom Sanitization Middleware
 * Replaces xss-clean and express-mongo-sanitize
 */

const sanitizeValue = (value) => {
  if (typeof value !== 'string') return value;

  // Remove $ to prevent NoSQL injection
  let sanitized = value.replace(/\$/g, '');

  // Basic XSS protection (remove script tags)
  sanitized = sanitized.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
  sanitized = sanitized.replace(/<[^>]*>/g, ""); // Remove all HTML tags

  return sanitized;
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  for (const key in obj) {
    if (key.startsWith('$')) {
      delete obj[key]; // Remove keys starting with $
      continue;
    }

    const value = obj[key];
    if (typeof value === 'string') {
      obj[key] = sanitizeValue(value);
    } else if (typeof value === 'object') {
      sanitizeObject(value);
    }
  }
  return obj;
};

function sanitizeMiddleware(req, res, next) {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
}

// Mock xss function for compatibility if used elsewhere
const xss = () => (req, res, next) => next();

module.exports = {
  sanitizeMiddleware,
  xss,
};

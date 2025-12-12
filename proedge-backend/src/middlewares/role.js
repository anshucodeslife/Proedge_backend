const { error } = require('../utils/response');

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    // SUPERADMIN has access to everything
    if (req.user.role === 'SUPERADMIN') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return error(res, 'Access denied. Insufficient permissions.', 403);
    }
    next();
  };
};

module.exports = roleMiddleware;

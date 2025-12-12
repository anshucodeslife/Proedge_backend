const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { error } = require('../utils/response');
const prisma = require('../config/prisma');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return error(res, 'Access denied. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await prisma.user.findUnique({ where: { id: parseInt(decoded.id) } });

    if (!user) {
      return error(res, 'Invalid token. User not found.', 401);
    }

    if (user.status !== 'ACTIVE') {
      return error(res, 'User account is inactive.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, 'Invalid token.', 401);
  }
};

module.exports = authMiddleware;

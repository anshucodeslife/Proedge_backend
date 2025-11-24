const { success } = require('../utils/response');
const prisma = require('../config/prisma');

const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    success(res, user, 'User profile fetched successfully');
  } catch (err) {
    next(err);
  }
};

const listStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      skip: parseInt(skip),
      take: parseInt(limit),
      select: { id: true, fullName: true, email: true, studentId: true, status: true, createdAt: true },
    });

    const total = await prisma.user.count({ where: { role: 'STUDENT' } });

    success(res, { students, total, page, limit }, 'Students fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  listStudents,
};

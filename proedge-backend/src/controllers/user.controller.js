const { success } = require('../utils/response');
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

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

const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const where = {};

    if (role) {
      where.role = role;
    } else {
      where.role = { not: 'SUPERADMIN' };
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, fullName: true, email: true, role: true,
        status: true, createdAt: true, contact: true,
        // Include minimal other fields if needed
      }
    });

    success(res, users, 'Users fetched successfully');
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { email, password, fullName, role, ...otherData } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw { statusCode: 400, message: 'Email already exists' };

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: role || 'STUDENT',
        status: 'ACTIVE',
        ...otherData
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    success(res, userWithoutPassword, 'User created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password, ...updateData } = req.body;

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    success(res, userWithoutPassword, 'User updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await performUserDeletion(parseInt(id));
    success(res, null, 'User and all related data deleted successfully');
  } catch (err) {
    next(err);
  }
};

const bulkDeleteUsers = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw { statusCode: 400, message: 'No user IDs provided for deletion' };
    }

    // Process deletions sequentially or in parallel?
    // Given the complexity of transactions, sequential is safer to avoid deadlocks or connection pool exhaustion
    // Alternatively, we can try to do it in one massive transaction if logically possible, 
    // but the where clauses might get complex. 
    // Let's use a helper function and Promise.all for reasonable batches, or just sequential for safety.

    // Using sequential for maximum safety against foreign key races
    for (const id of ids) {
      await performUserDeletion(parseInt(id));
    }

    success(res, null, `${ids.length} users deleted successfully`);
  } catch (err) {
    next(err);
  }
};

// Helper function for deletion logic to be reused
const performUserDeletion = async (userId) => {
  // Fetch related records to handle deep deletions (Invoice -> Payment -> Enrollment)
  const enrollments = await prisma.enrollment.findMany({ where: { userId }, select: { id: true } });
  const enrollmentIds = enrollments.map(e => e.id);

  const payments = await prisma.payment.findMany({ where: { enrollmentId: { in: enrollmentIds } }, select: { id: true } });
  const paymentIds = payments.map(p => p.id);

  await prisma.$transaction([
    // 1. Direct dependencies
    prisma.attendance.deleteMany({ where: { userId } }),
    prisma.watchLog.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),

    // 2. Deep dependencies via Enrollment
    prisma.invoice.deleteMany({ where: { paymentId: { in: paymentIds } } }),
    prisma.payment.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } }),
    prisma.enrollmentHistory.deleteMany({ where: { enrollmentId: { in: enrollmentIds } } }),

    // 3. Delete Enrollments
    prisma.enrollment.deleteMany({ where: { userId } }),

    // 4. Finally delete User
    prisma.user.delete({ where: { id: userId } })
  ]);
};

module.exports = {
  getProfile,
  listStudents,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkDeleteUsers
};

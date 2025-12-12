const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const prisma = require('../config/prisma');

const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const signup = async (data) => {
  const { email, password, fullName, role, studentId } = data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw { statusCode: 400, message: 'Email already exists' };
  }

  if (studentId) {
    const existingStudentId = await prisma.user.findUnique({ where: { studentId } });
    if (existingStudentId) {
      throw { statusCode: 400, message: 'Student ID already exists' };
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: role || 'STUDENT',
      studentId,
    },
  });

  const token = generateToken(user);

  // Remove passwordHash from response
  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  if (user.status !== 'ACTIVE') {
    throw { statusCode: 403, message: 'Account is inactive' };
  }

  const token = generateToken(user);

  // Remove passwordHash from response
  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }
  // Mock OTP for now
  const otp = Math.floor(100000 + Math.random() * 900000);
  console.log(`[DEV] OTP for ${email}: ${otp}`);
  return { message: 'OTP sent to email (check console)' };
};

module.exports = {
  signup,
  login,
  forgotPassword,
};

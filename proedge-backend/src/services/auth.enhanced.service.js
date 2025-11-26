const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Verify if student ID exists in pre-approved list
 */
async function verifyStudentId(studentId) {
  const preApproved = await prisma.preApprovedStudent.findUnique({
    where: { studentId },
  });
  
  return {
    isValid: !!preApproved,
    student: preApproved,
  };
}

/**
 * Register student with student ID verification
 */
async function signupWithStudentId({ studentId, email, password, fullName }) {
  // Check if student ID is pre-approved
  const verification = await verifyStudentId(studentId);
  
  if (!verification.isValid) {
    throw new Error('Student ID not found in pre-approved list');
  }
  
  // Check if student ID already used
  const existingUser = await prisma.user.findUnique({
    where: { studentId },
  });
  
  if (existingUser) {
    throw new Error('Student ID already registered');
  }
  
  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingEmail) {
    throw new Error('Email already registered');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      studentId,
      email,
      passwordHash,
      fullName: fullName || verification.student.fullName,
      role: 'STUDENT',
      studentIdVerified: true,
      isPreApproved: true,
    },
    select: {
      id: true,
      studentId: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      studentIdVerified: true,
    },
  });
  
  return user;
}

/**
 * Generate OTP for password reset
 */
async function generateOTP(email) {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Generate 6-digit OTP
  const otpCode = crypto.randomInt(100000, 999999).toString();
  
  // Set OTP expiry to 10 minutes from now
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  
  // Update user with OTP
  await prisma.user.update({
    where: { email },
    data: {
      otpCode,
      otpExpiry,
    },
  });
  
  // TODO: Send OTP via email (for now, log to console)
  console.log(`OTP for ${email}: ${otpCode}`);
  
  return {
    message: 'OTP sent successfully',
    // In production, don't return OTP
    otp: process.env.NODE_ENV === 'development' ? otpCode : undefined,
  };
}

/**
 * Verify OTP
 */
async function verifyOTP(email, otpCode) {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!user.otpCode || !user.otpExpiry) {
    throw new Error('No OTP found for this user');
  }
  
  if (new Date() > user.otpExpiry) {
    throw new Error('OTP has expired');
  }
  
  if (user.otpCode !== otpCode) {
    throw new Error('Invalid OTP');
  }
  
  // Clear OTP after successful verification
  await prisma.user.update({
    where: { email },
    data: {
      otpCode: null,
      otpExpiry: null,
    },
  });
  
  return {
    message: 'OTP verified successfully',
    userId: user.id,
  };
}

/**
 * Reset password
 */
async function resetPassword(email, otpCode, newPassword) {
  // Verify OTP first
  await verifyOTP(email, otpCode);
  
  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  // Update password
  await prisma.user.update({
    where: { email },
    data: {
      passwordHash,
    },
  });
  
  return {
    message: 'Password reset successfully',
  };
}

module.exports = {
  verifyStudentId,
  signupWithStudentId,
  generateOTP,
  verifyOTP,
  resetPassword,
};

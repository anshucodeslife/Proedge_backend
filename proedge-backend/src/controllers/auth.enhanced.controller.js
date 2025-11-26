const authEnhancedService = require('../services/auth.enhanced.service');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Verify student ID
 */
async function verifyStudentId(req, res, next) {
  try {
    const { studentId } = req.body;
    
    const result = await authEnhancedService.verifyStudentId(studentId);
    
    res.status(200).json({
      success: true,
      message: result.isValid ? 'Student ID is valid' : 'Student ID not found',
      data: {
        isValid: result.isValid,
        fullName: result.student?.fullName,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Signup with student ID
 */
async function signupWithStudentId(req, res, next) {
  try {
    const { studentId, email, password, fullName } = req.body;
    
    const user = await authEnhancedService.signupWithStudentId({
      studentId,
      email,
      password,
      fullName,
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    
    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Send OTP for password reset
 */
async function sendOTP(req, res, next) {
  try {
    const { email } = req.body;
    
    const result = await authEnhancedService.generateOTP(email);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: process.env.NODE_ENV === 'development' ? { otp: result.otp } : {},
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify OTP
 */
async function verifyOTP(req, res, next) {
  try {
    const { email, otpCode } = req.body;
    
    const result = await authEnhancedService.verifyOTP(email, otpCode);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: { userId: result.userId },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset password
 */
async function resetPassword(req, res, next) {
  try {
    const { email, otpCode, newPassword } = req.body;
    
    const result = await authEnhancedService.resetPassword(email, otpCode, newPassword);
    
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  verifyStudentId,
  signupWithStudentId,
  sendOTP,
  verifyOTP,
  resetPassword,
};

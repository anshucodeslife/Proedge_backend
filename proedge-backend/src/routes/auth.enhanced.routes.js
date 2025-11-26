const express = require('express');
const { body } = require('express-validator');
const authEnhancedController = require('../controllers/auth.enhanced.controller');
const validate = require('../middlewares/validate');

const router = express.Router();

/**
 * @swagger
 * /auth/verify-student-id:
 *   post:
 *     summary: Verify if student ID exists in pre-approved list
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId]
 *             properties:
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student ID verification result
 */
router.post(
  '/verify-student-id',
  [body('studentId').notEmpty().withMessage('Student ID is required')],
  validate,
  authEnhancedController.verifyStudentId
);

/**
 * @swagger
 * /auth/signup-with-id:
 *   post:
 *     summary: Register student with student ID verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, email, password]
 *             properties:
 *               studentId:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student registered successfully
 */
router.post(
  '/signup-with-id',
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  authEnhancedController.signupWithStudentId
);

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post(
  '/send-otp',
  [body('email').isEmail().withMessage('Invalid email')],
  validate,
  authEnhancedController.sendOTP
);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otpCode]
 *             properties:
 *               email:
 *                 type: string
 *               otpCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('otpCode').notEmpty().withMessage('OTP code is required'),
  ],
  validate,
  authEnhancedController.verifyOTP
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otpCode, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *               otpCode:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('otpCode').notEmpty().withMessage('OTP code is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  authEnhancedController.resetPassword
);

module.exports = router;

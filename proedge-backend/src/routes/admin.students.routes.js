const express = require('express');
const { body } = require('express-validator');
const adminStudentController = require('../controllers/admin.student.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');
const validate = require('../middlewares/validate');

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

/**
 * @swagger
 * /admin/students:
 *   post:
 *     summary: Create a new student (Admin only)
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               studentId:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullName:
 *                 type: string
 *               isPreApproved:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Student created successfully
 */
router.post(
  '/',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').notEmpty().withMessage('Full name is required'),
  ],
  validate,
  adminStudentController.createStudent
);

/**
 * @swagger
 * /admin/students/{id}:
 *   put:
 *     summary: Update student details
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               studentId:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated successfully
 */
router.put('/:id', adminStudentController.updateStudent);

/**
 * @swagger
 * /admin/students/{id}:
 *   delete:
 *     summary: Delete or deactivate student
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hardDelete
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Student deleted/deactivated successfully
 */
router.delete('/:id', adminStudentController.deleteStudent);

/**
 * @swagger
 * /admin/students/{id}/assign-course:
 *   post:
 *     summary: Assign student to course
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId]
 *             properties:
 *               courseId:
 *                 type: string
 *               batchId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Student assigned to course successfully
 */
router.post(
  '/:id/assign-course',
  [body('courseId').notEmpty().withMessage('Course ID is required')],
  validate,
  adminStudentController.assignToCourse
);

/**
 * @swagger
 * /admin/students/{id}/assign-batch:
 *   post:
 *     summary: Assign student to batch
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [batchId]
 *             properties:
 *               batchId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student assigned to batch successfully
 */
router.post(
  '/:id/assign-batch',
  [body('batchId').notEmpty().withMessage('Batch ID is required')],
  validate,
  adminStudentController.assignToBatch
);

/**
 * @swagger
 * /admin/students/bulk-upload:
 *   post:
 *     summary: Bulk upload students from CSV
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Bulk upload completed
 */
router.post(
  '/bulk-upload',
  adminStudentController.upload.single('file'),
  adminStudentController.bulkUpload
);

/**
 * @swagger
 * /admin/students/pre-approved:
 *   post:
 *     summary: Add pre-approved student
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, fullName]
 *             properties:
 *               studentId:
 *                 type: string
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pre-approved student added successfully
 */
router.post(
  '/pre-approved',
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('fullName').notEmpty().withMessage('Full name is required'),
  ],
  validate,
  adminStudentController.addPreApproved
);

module.exports = router;

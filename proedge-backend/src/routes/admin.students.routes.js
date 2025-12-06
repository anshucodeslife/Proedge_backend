const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const adminStudentController = require('../controllers/admin.student.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');
const validate = require('../middlewares/validate');

// Protect all routes
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

/**
 * @swagger
 * /admin/students:
 *   get:
 *     summary: Get all students
 *     tags: [Admin - Students]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/', adminStudentController.getAllStudents);

/**
 * @swagger
 * /admin/students:
 *   post:
 *     summary: Create new student
 *     tags: [Admin - Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, email, password, fullName]
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
router.post('/', [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required')
], validate, adminStudentController.createStudent);

/**
 * @swagger
 * /admin/students/{id}:
 *   put:
 *     summary: Update student details
 *     tags: [Admin - Students]
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

/**
 * @swagger
 * /admin/students/pre-approved:
 *   get:
 *     summary: Get all pre-approved students
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pre-approved students
 */
router.get('/pre-approved', adminStudentController.getPreApproved);

/**
 * @swagger
 * /admin/students/pre-approved/{id}:
 *   delete:
 *     summary: Delete pre-approved student
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pre-approved student deleted
 */
router.delete('/pre-approved/:id', adminStudentController.deletePreApproved);

/**
 * @swagger
 * /admin/students/bulk-status:
 *   post:
 *     summary: Bulk update student status
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentIds, status]
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Bulk status update completed
 */
router.post(
  '/bulk-status',
  [
    body('studentIds').isArray({ min: 1 }).withMessage('Student IDs array is required'),
    body('status').isIn(['ACTIVE', 'INACTIVE']).withMessage('Valid status required'),
  ],
  validate,
  adminStudentController.bulkStatusUpdate
);

/**
 * @swagger
 * /admin/students/bulk-assign:
 *   post:
 *     summary: Bulk assign students to course
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentIds, courseId]
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               courseId:
 *                 type: string
 *               batchId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bulk assignment completed
 */
router.post(
  '/bulk-assign',
  [
    body('studentIds').isArray({ min: 1 }).withMessage('Student IDs array is required'),
    body('courseId').notEmpty().withMessage('Course ID is required'),
  ],
  validate,
  adminStudentController.bulkAssignCourse
);

/**
 * @swagger
 * /admin/students:
 *   get:
 *     summary: Get all students with pagination and filtering
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: batchId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of students with pagination
 */
router.get('/', adminStudentController.getAllStudents);

/**
 * @swagger
 * /admin/students/{id}:
 *   get:
 *     summary: Get single student with full details
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student details
 */
router.get('/:id', adminStudentController.getStudentById);

/**
 * @swagger
 * /admin/students/{id}/enrollments:
 *   get:
 *     summary: Get student enrollments
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student enrollments
 */
router.get('/:id/enrollments', adminStudentController.getStudentEnrollments);

/**
 * @swagger
 * /admin/students/{id}/progress:
 *   get:
 *     summary: Get student progress
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
 *         name: courseId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student progress
 */
router.get('/:id/progress', adminStudentController.getStudentProgress);

/**
 * @swagger
 * /admin/students/{id}/enrollments/{enrollmentId}:
 *   delete:
 *     summary: Remove student enrollment
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment removed
 */
router.delete('/:id/enrollments/:enrollmentId', adminStudentController.removeEnrollment);

/**
 * @swagger
 * /admin/students/{id}/status:
 *   patch:
 *     summary: Update student status
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/:id/status',
  [body('status').isIn(['ACTIVE', 'INACTIVE']).withMessage('Valid status required')],
  validate,
  adminStudentController.updateStudentStatus
);

/**
 * @swagger
 * /admin/students/{id}/reset-password:
 *   post:
 *     summary: Reset student password
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
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post(
  '/:id/reset-password',
  [body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  validate,
  adminStudentController.resetPassword
);

module.exports = router;


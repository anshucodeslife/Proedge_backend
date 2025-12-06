const express = require('express');
const adminCourseController = require('../controllers/admin.course.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

/**
 * @swagger
 * /admin/courses:
 *   get:
 *     summary: Get all courses with pagination
 *     tags: [Admin - Courses]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', adminCourseController.getAllCourses);

/**
 * @swagger
 * /admin/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Admin - Courses]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', adminCourseController.getCourseById);

/**
 * @swagger
 * /admin/courses/{id}/students:
 *   get:
 *     summary: Get course students
 *     tags: [Admin - Courses]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/students', adminCourseController.getCourseStudents);

module.exports = router;

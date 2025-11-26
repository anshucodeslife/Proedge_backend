const express = require('express');
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

const router = express.Router();

// All routes require student authentication
router.use(authMiddleware);
router.use(roleMiddleware(['STUDENT']));

/**
 * @swagger
 * /student/courses:
 *   get:
 *     summary: Get enrolled courses
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrolled courses fetched successfully
 */
router.get('/courses', studentController.getEnrolledCourses);

/**
 * @swagger
 * /student/courses/{courseId}:
 *   get:
 *     summary: Get course details
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details fetched successfully
 */
router.get('/courses/:courseId', studentController.getCourseDetails);

/**
 * @swagger
 * /student/courses/{courseId}/modules:
 *   get:
 *     summary: Get course modules
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Modules fetched successfully
 */
router.get('/courses/:courseId/modules', studentController.getCourseModules);

/**
 * @swagger
 * /student/lessons/{lessonId}:
 *   get:
 *     summary: Get lesson details with video URL
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson details fetched successfully
 */
router.get('/lessons/:lessonId', studentController.getLessonDetails);

/**
 * @swagger
 * /student/courses/{courseId}/progress:
 *   get:
 *     summary: Get course progress
 *     tags: [Student]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course progress fetched successfully
 */
router.get('/courses/:courseId/progress', studentController.getCourseProgress);

module.exports = router;

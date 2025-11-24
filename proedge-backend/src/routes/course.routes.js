const express = require('express');
const { body } = require('express-validator');
const courseController = require('../controllers/course.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

const router = express.Router();

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slug]
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Course created
 */
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('slug').notEmpty().withMessage('Slug is required'),
  ],
  courseController.createCourse
);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: List all courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get('/', courseController.getCourses);

router.get('/:slug', courseController.getCourseBySlug);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  courseController.updateCourse
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['ADMIN']),
  courseController.deleteCourse
);

module.exports = router;

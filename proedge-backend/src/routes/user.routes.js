const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

const router = express.Router();

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/profile', authMiddleware, userController.getProfile);

/**
 * @swagger
 * /users/students:
 *   get:
 *     summary: List all students (Admin/Tutor only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of students
 */
router.get(
  '/students',
  authMiddleware,
  roleMiddleware(['ADMIN', 'TUTOR']),
  userController.listStudents
);

// Generic User CRUD
router.get('/', authMiddleware, roleMiddleware(['ADMIN']), userController.getAllUsers);
router.post('/', authMiddleware, roleMiddleware(['ADMIN']), userController.createUser);
router.post('/bulk-delete', authMiddleware, roleMiddleware(['ADMIN']), userController.bulkDeleteUsers); // Bulk delete
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), userController.updateUser);
router.delete('/:id', authMiddleware, roleMiddleware(['ADMIN']), userController.deleteUser);

module.exports = router;

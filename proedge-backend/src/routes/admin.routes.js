const express = require('express');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

const router = express.Router();

router.get('/stats/overview', authMiddleware, roleMiddleware(['ADMIN']), adminController.getOverviewStats);
router.get('/reports/video-engagement', authMiddleware, roleMiddleware(['ADMIN']), adminController.getVideoEngagement);
router.get('/students/search', authMiddleware, roleMiddleware(['ADMIN']), adminController.searchStudents);
router.post('/courses/:id/assign', authMiddleware, roleMiddleware(['ADMIN']), adminController.assignCourse);

module.exports = router;

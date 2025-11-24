const express = require('express');
const enrollmentController = require('../controllers/enrollment.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

const router = express.Router();

// Enrollment routes
router.post('/', authMiddleware, enrollmentController.enrollStudent);
router.get('/', authMiddleware, enrollmentController.getEnrollments);
router.put('/:id/status', authMiddleware, roleMiddleware(['ADMIN']), enrollmentController.updateEnrollmentStatus);

// Attendance routes
router.post('/attendance', authMiddleware, roleMiddleware(['ADMIN', 'TUTOR']), enrollmentController.markAttendance);
router.get('/attendance', authMiddleware, enrollmentController.getAttendance);

// WatchLog routes
router.post('/watchlogs', authMiddleware, enrollmentController.updateWatchLog);
router.get('/watchlogs', authMiddleware, enrollmentController.getWatchLogs);

module.exports = router;

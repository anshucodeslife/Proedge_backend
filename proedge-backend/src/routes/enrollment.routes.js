const express = require('express');
const enrollmentController = require('../controllers/enrollment.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

const router = express.Router();

// Enrollment routes
// Public enrollment init (Sign Up & Pay)
// Public enrollment init (Sign Up & Pay)
router.post('/initiate', (req, res, next) => {
    console.log('Hits /initiate route', req.body);
    next();
}, enrollmentController.initiateEnrollment);

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

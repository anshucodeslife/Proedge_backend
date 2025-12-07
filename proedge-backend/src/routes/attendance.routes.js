const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

// Admin routes
router.post(
    '/upload',
    authMiddleware,
    roleMiddleware(['ADMIN']),
    attendanceController.uploadAttendance
);

router.get(
    '/',
    authMiddleware,
    roleMiddleware(['ADMIN']),
    attendanceController.getAttendance
);

router.put(
    '/:id',
    authMiddleware,
    roleMiddleware(['ADMIN']),
    attendanceController.updateAttendance
);

router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware(['ADMIN']),
    attendanceController.deleteAttendance
);

module.exports = router;

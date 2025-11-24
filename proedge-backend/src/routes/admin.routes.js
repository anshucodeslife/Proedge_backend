const express = require('express');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

const router = express.Router();

router.get('/stats/overview', authMiddleware, roleMiddleware(['ADMIN']), adminController.getOverviewStats);
router.get('/reports/video-engagement', authMiddleware, roleMiddleware(['ADMIN']), adminController.getVideoEngagement);

module.exports = router;

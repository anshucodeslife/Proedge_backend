const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');

// Traffic
router.post('/track', systemController.trackVisit); // Public
router.get('/traffic', systemController.getTrafficStats); // Admin only

// System Stats (Traffic)
router.get('/stats', authMiddleware, roleMiddleware(['ADMIN']), systemController.getTrafficStats);

// Settings
router.get('/settings', systemController.getSettings); // Admin
router.post('/settings', systemController.updateSettings); // Admin

// Reset Data (Dev/Admin)
router.post('/reset-data', systemController.resetData);

module.exports = router;

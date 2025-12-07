const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');

// Traffic
router.post('/track', systemController.trackVisit); // Public
router.get('/traffic', systemController.getTrafficStats); // Admin only

// Settings
router.get('/settings', systemController.getSettings); // Admin
router.post('/settings', systemController.updateSettings); // Admin

// Reset Data (Dev/Admin)
router.post('/reset-data', systemController.resetData);

module.exports = router;

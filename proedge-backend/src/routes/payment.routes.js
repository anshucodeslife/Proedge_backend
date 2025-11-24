const express = require('express');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

router.post('/order', authMiddleware, paymentController.createOrder);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;

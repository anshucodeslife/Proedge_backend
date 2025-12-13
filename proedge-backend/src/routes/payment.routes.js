const express = require('express');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth');

const router = express.Router();

// List payments (Admin only)
router.get('/', authMiddleware, paymentController.getAllPayments);

router.post('/order', authMiddleware, paymentController.createOrder);
router.patch('/:paymentId/status', authMiddleware, paymentController.updatePaymentStatus);
router.post('/verify', paymentController.verifyPayment);
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;

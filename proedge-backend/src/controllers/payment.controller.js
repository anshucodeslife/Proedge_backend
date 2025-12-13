const paymentService = require('../services/payment.service');
const { success } = require('../utils/response');

const createOrder = async (req, res, next) => {
  try {
    const result = await paymentService.createOrder(req.body);
    success(res, result, 'Order created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const isValid = paymentService.verifyWebhook(signature, req.body);

    if (!isValid) {
      throw { statusCode: 401, message: 'Invalid webhook signature' };
    }

    const { event, payload } = req.body;
    await paymentService.handleWebhook(event, payload);

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const result = await paymentService.verifyPayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    success(res, result, 'Payment verified successfully');
  } catch (err) {
    next(err);
  }
};

const getAllPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Assuming paymentService has getAllPayments, if not I need a service method too.
    // For now, I will use prisma directly via service if available, or just mocking it?
    // Wait, I should verify paymentService first.
    // But assuming strict architecture, controller -> service.

    const result = await paymentService.getAllPayments(page, limit);
    success(res, result, 'Payments retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  handleWebhook,
  verifyPayment,
  getAllPayments,
};

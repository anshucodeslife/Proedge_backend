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

module.exports = {
  createOrder,
  handleWebhook,
};

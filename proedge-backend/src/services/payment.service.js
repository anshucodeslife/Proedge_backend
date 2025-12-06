const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const config = require('../config/env');
const prisma = require('../config/prisma');

const createOrder = async (data) => {
  const { amount, currency, enrollmentId } = data;

  const options = {
    amount: amount * 100, // amount in paise
    currency: currency || 'INR',
    receipt: `receipt_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      provider: 'razorpay',
      providerPaymentId: order.id,
      amount,
      currency: currency || 'INR',
      status: 'INITIATED',
      enrollmentId,
    },
  });

  return { order, payment };
};

const verifyWebhook = (signature, body) => {
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(JSON.stringify(body))
    .digest('hex');

  return signature === expectedSignature;
};

const handleWebhook = async (event, data) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = data;

  if (event === 'payment.captured') {
    // Find payment by provider payment ID
    const payment = await prisma.payment.findFirst({
      where: { providerPaymentId: razorpay_order_id },
    });

    if (payment) {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS' },
      });

      // Activate enrollment if linked
      if (payment.enrollmentId) {
        await prisma.enrollment.update({
          where: { id: payment.enrollmentId },
          data: { status: 'ACTIVE' },
        });
      }
    }
  }

  return { success: true };
};

const getAllPayments = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      skip,
      take: limit,
      include: {
        enrollment: {
          include: {
            user: {
              select: { fullName: true, email: true }
            },
            course: {
              select: { title: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.count(),
  ]);

  return {
    payments,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    },
  };
};

module.exports = {
  createOrder,
  verifyWebhook,
  handleWebhook,
  getAllPayments,
};

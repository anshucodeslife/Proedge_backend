const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const config = require('../config/env');
const prisma = require('../config/prisma');

const createOrder = async (data) => {
  const { amount, currency, enrollmentId } = data;

  const keyId = config.razorpay.keyId;
  console.log(`[Razorpay] Creating Order with Key: ${keyId ? keyId.substring(0, 8) + '...' : 'UNDEFINED'}`);

  const options = {
    amount: amount * 100, // amount in paise
    currency: currency || 'INR',
    receipt: `receipt_${Date.now()}`,
  };

  let order;
  try {
    order = await razorpay.orders.create(options);
  } catch (err) {
    console.error('Razorpay Create Order Failed:', err);
    // If invalid key/secret, Razorpay returns 401. 
    // We should throw a 500 or 503 instead of letting 401 confuse the frontend.
    throw { statusCode: 500, message: 'Payment Hub Error: ' + (err.error?.description || err.message) };
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      provider: 'razorpay',
      orderId: order.id, // Required field mapping to Razorpay Order ID
      providerPaymentId: null, // Will be filled after payment capture
      amount,
      currency: currency || 'INR',
      status: 'INITIATED',
      enrollmentId: enrollmentId ? Number(enrollmentId) : null,
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

      // Create Invoice
      const invoiceNo = `INV-${Date.now()}`;
      await prisma.invoice.create({
        data: {
          paymentId: payment.id,
          invoiceNo: invoiceNo,
          amount: payment.amount,
          total: payment.amount,
          tax: 0, // Logic for tax can be added here
          pdfUrl: null // Generate PDF later if needed
        }
      });
    }
  }

  return { success: true };
};

const verifyPayment = async ({ orderId, paymentId, signature }) => {
  // Verify Razorpay signature
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (signature !== expectedSignature) {
    throw { statusCode: 401, message: 'Invalid payment signature' };
  }

  // Find payment by orderId
  const payment = await prisma.payment.findFirst({
    where: { orderId },
    include: {
      enrollment: {
        include: {
          user: true,
          course: true
        }
      }
    }
  });

  if (!payment) {
    throw { statusCode: 404, message: 'Payment not found' };
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'SUCCESS',
      paymentId,
      providerPaymentId: paymentId,
      razorpaySignature: signature
    }
  });

  // Activate enrollment if linked
  if (payment.enrollmentId) {
    await prisma.enrollment.update({
      where: { id: payment.enrollmentId },
      data: { status: 'ACTIVE' }
    });

    // Activate user
    await prisma.user.update({
      where: { id: payment.enrollment.userId },
      data: { status: 'ACTIVE' }
    });
  }

  // Create Invoice
  const invoiceNo = `INV-${Date.now()}`;
  const invoice = await prisma.invoice.create({
    data: {
      paymentId: payment.id,
      invoiceNo,
      amount: payment.amount,
      total: payment.amount,
      tax: 0
    }
  });

  return {
    invoiceNo,
    invoiceId: invoice.id,
    amount: payment.amount,
    studentName: payment.enrollment?.user?.fullName,
    studentEmail: payment.enrollment?.user?.email,
    courseName: payment.enrollment?.course?.title
  };
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
  verifyPayment,
  getAllPayments,
};

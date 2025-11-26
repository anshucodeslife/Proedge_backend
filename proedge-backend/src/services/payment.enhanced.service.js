const prisma = require('../config/prisma');

/**
 * Enhanced payment webhook - auto activate enrollment
 */
async function handlePaymentWebhook(paymentData) {
  const { orderId, paymentId, status, signature, amount } = paymentData;

  // Find payment record
  let payment = await prisma.payment.findUnique({
    where: { orderId },
    include: { enrollment: true },
  });

  if (!payment) {
    // Create payment record if doesn't exist
    payment = await prisma.payment.create({
      data: {
        orderId,
        paymentId,
        provider: 'razorpay',
        amount,
        currency: 'INR',
        status: status === 'captured' ? 'SUCCESS' : 'FAILED',
        razorpaySignature: signature,
      },
    });
  } else {
    // Update existing payment
    payment = await prisma.payment.update({
      where: { orderId },
      data: {
        paymentId,
        status: status === 'captured' ? 'SUCCESS' : 'FAILED',
        razorpaySignature: signature,
      },
      include: { enrollment: true },
    });
  }

  // If payment successful, activate enrollment
  if (status === 'captured' && payment.enrollmentId) {
    await prisma.enrollment.update({
      where: { id: payment.enrollmentId },
      data: {
        status: 'ACTIVE',
      },
    });

    // Create invoice
    const invoiceNo = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const tax = amount * 0.18; // 18% GST
    const total = amount + tax;

    await prisma.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNo,
        amount,
        tax,
        total,
      },
    });
  }

  return payment;
}

/**
 * Get payment history
 */
async function getPaymentHistory(userId) {
  const payments = await prisma.payment.findMany({
    where: {
      enrollment: {
        userId,
      },
    },
    include: {
      enrollment: {
        include: {
          course: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      },
      invoice: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return payments;
}

/**
 * Create payment order
 */
async function createPaymentOrder(userId, courseId, batchId, amount) {
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create or find enrollment
  let enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
    },
  });

  if (!enrollment) {
    enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        batchId,
        status: 'PENDING',
      },
    });
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      orderId,
      provider: 'razorpay',
      amount,
      currency: 'INR',
      status: 'INITIATED',
      enrollmentId: enrollment.id,
    },
  });

  return {
    orderId,
    amount,
    currency: 'INR',
    enrollmentId: enrollment.id,
  };
}

module.exports = {
  handlePaymentWebhook,
  getPaymentHistory,
  createPaymentOrder,
};

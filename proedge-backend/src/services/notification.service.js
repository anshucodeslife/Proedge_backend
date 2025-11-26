const prisma = require('../config/prisma');
const nodemailer = require('nodemailer');

// Email transporter (configure with your email service)
// Only create if SMTP credentials are provided
let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send notification
 */
async function sendNotification(userId, type, title, message, data = null) {
  // Create notification record
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data,
    },
  });

  // Send based on type
  if (type === 'EMAIL') {
    await sendEmail(userId, title, message);
  } else if (type === 'PUSH') {
    // TODO: Implement push notification (FCM)
    console.log(`Push notification to user ${userId}: ${title}`);
  }

  return notification;
}

/**
 * Send email
 */
async function sendEmail(userId, subject, text) {
  if (!transporter) {
    console.log('Email transporter not configured, skipping email send');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, fullName: true },
  });

  if (!user) return;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@proedge.com',
      to: user.email,
      subject,
      text,
      html: `<p>${text}</p>`,
    });
  } catch (error) {
    console.error('Email send error:', error);
  }
}

/**
 * Get user notifications
 */
async function getUserNotifications(userId, limit = 20) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { sentAt: 'desc' },
    take: limit,
  });

  return notifications;
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId) {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

/**
 * Send enrollment notification
 */
async function sendEnrollmentNotification(userId, courseName) {
  await sendNotification(
    userId,
    'IN_APP',
    'Enrollment Successful',
    `You have been successfully enrolled in ${courseName}`,
    { type: 'enrollment' }
  );
}

/**
 * Send batch change notification
 */
async function sendBatchChangeNotification(userId, batchName) {
  await sendNotification(
    userId,
    'IN_APP',
    'Batch Assignment',
    `You have been assigned to batch: ${batchName}`,
    { type: 'batch_change' }
  );
}

/**
 * Delete notification
 */
async function deleteNotification(notificationId) {
  await prisma.notification.delete({
    where: { id: notificationId },
  });
}

module.exports = {
  sendNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification,
  sendEnrollmentNotification,
  sendBatchChangeNotification,
};

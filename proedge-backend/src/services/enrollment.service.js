const prisma = require('../config/prisma');

const paymentService = require('./payment.service');
const courseService = require('./course.service');
const bcrypt = require('bcryptjs');

// Enrollment
const enrollStudent = async (data) => {
  const { userId, courseId, batchId } = data;

  // Check if already enrolled
  const existing = await prisma.enrollment.findFirst({
    where: { userId, courseId, status: 'ACTIVE' },
  });

  if (existing) {
    throw { statusCode: 400, message: 'User is already enrolled in this course' };
  }

  return await prisma.enrollment.create({
    data: { userId, courseId, batchId, status: 'PENDING' },
  });
};

const initiateEnrollment = async (data) => {
  // Extract inputs. Note: 'name' might come from frontend, mapping to 'fullName'
  const {
    name, fullName, email, contact, courseId,
    enrollmentDetails = {}
  } = data;

  const userFullName = fullName || name;
  const batchTiming = enrollmentDetails.batchTiming || data.batchTiming;

  // Prepare profile fields to save/update
  const profileData = {
    fullName: userFullName,
    contact,
    // Map fields from enrollmentDetails
    dob: enrollmentDetails.dob,
    gender: enrollmentDetails.gender,
    address: enrollmentDetails.address,
    parentName: enrollmentDetails.parentName,
    parentContact: enrollmentDetails.parentContact,

    // Academic
    currentSchool: enrollmentDetails.academic?.school,
    classYear: enrollmentDetails.academic?.class,
    subjects: enrollmentDetails.academic?.subjects,

    // Preferences
    batchTiming,

    // Fees & Payment (From EnrollModal)
    totalFees: enrollmentDetails.totalFees,
    originalFees: enrollmentDetails.originalFees,
    paymentOption: enrollmentDetails.paymentOption,

    // Installments
    installment1Amount: enrollmentDetails.paymentPlan?.inst1,
    installment2Amount: enrollmentDetails.paymentPlan?.inst2,
    installment3Amount: enrollmentDetails.paymentPlan?.inst3,

    installment2Date: enrollmentDetails.paymentPlan?.dueDate2,
    installment3Date: enrollmentDetails.paymentPlan?.dueDate3,
  };

  // 1. Find or Create User
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = await bcrypt.hash(contact, 10); // Default password returns to phone number
    user = await prisma.user.create({
      data: {
        ...profileData,
        email,
        passwordHash,
        role: 'STUDENT',
        status: 'ACTIVE',
        isPreApproved: true // Auto-approve via payment
      }
    });
  } else {
    // Update existing user profile with latest info
    user = await prisma.user.update({
      where: { id: user.id },
      data: profileData
    });
  }

  // 2. Check if already active
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId: Number(courseId), status: 'ACTIVE' },
  });

  if (existingEnrollment) {
    throw { statusCode: 400, message: 'You are already enrolled in this course' };
  }

  // 3. Get Course Price
  const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
  if (!course) throw { statusCode: 404, message: 'Course not found' };

  // 4. Create Pending Enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: user.id,
      courseId: Number(courseId),
      status: 'PENDING',
      batchId: null // Batch assignment can happen later
    }
  });

  // 5. Create Razorpay Order
  // 5. Create Razorpay Order
  // Support for Partial Payment / Installments defined by frontend
  let amountToCharge = Number(data.amount);

  if (!amountToCharge || amountToCharge <= 0) {
    const course = await prisma.course.findUnique({ where: { id: Number(courseId) } });
    if (!course) throw { statusCode: 404, message: 'Course not found' };
    amountToCharge = Number(course.price);
  }

  // Double check if free
  if (amountToCharge <= 0) {
    // Free course, activate immediately
    await prisma.enrollment.update({ where: { id: enrollment.id }, data: { status: 'ACTIVE' } });
    return { success: true, message: 'Enrolled successfully (Free Course)', enrollmentId: enrollment.id };
  }

  const { order } = await paymentService.createOrder({
    amount: amountToCharge,
    currency: 'INR',
    enrollmentId: enrollment.id
  });

  return {
    success: true,
    orderId: order.id,
    amount: order.amount, // Amount in subunits (e.g. 500000 paise)
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID, // Frontend needs this
    enrollmentId: enrollment.id,
    user: {
      name: user.fullName,
      email: user.email,
      contact: user.contact
    }
  };
};

const getEnrollments = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const where = userId ? { userId } : {};

  const enrollments = await prisma.enrollment.findMany({
    where,
    skip: parseInt(skip),
    take: parseInt(limit),
    include: { course: true, batch: true, user: { select: { id: true, fullName: true, email: true } } },
  });

  const total = await prisma.enrollment.count({ where });
  return { enrollments, total, page, limit };
};

const updateEnrollmentStatus = async (id, status) => {
  return await prisma.enrollment.update({
    where: { id },
    data: { status },
  });
};

// Attendance
const markAttendance = async (data) => {
  const { userId, batchId, date, status } = data;

  // Check if already marked
  const existing = await prisma.attendance.findFirst({
    where: { userId, batchId, date: new Date(date) },
  });

  if (existing) {
    return await prisma.attendance.update({
      where: { id: existing.id },
      data: { status },
    });
  }

  return await prisma.attendance.create({
    data: { userId, batchId, date: new Date(date), status },
  });
};

const getAttendance = async (userId, batchId) => {
  const where = {};
  if (userId) where.userId = userId;
  if (batchId) where.batchId = batchId;

  return await prisma.attendance.findMany({
    where,
    include: { user: { select: { fullName: true, email: true } }, batch: true },
    orderBy: { date: 'desc' },
  });
};

// WatchLog
const updateWatchLog = async (data) => {
  const { userId, lessonId, watchedSec, events } = data;

  const existing = await prisma.watchLog.findFirst({
    where: { userId, lessonId },
  });

  if (existing) {
    return await prisma.watchLog.update({
      where: { id: existing.id },
      data: { watchedSec, events },
    });
  }

  return await prisma.watchLog.create({
    data: { userId, lessonId, watchedSec, events },
  });
};

const getWatchLogs = async (userId, lessonId) => {
  const where = {};
  if (userId) where.userId = userId;
  if (lessonId) where.lessonId = lessonId;

  return await prisma.watchLog.findMany({
    where,
    include: { lesson: true },
  });
};

module.exports = {
  enrollStudent,
  initiateEnrollment,
  getEnrollments,
  updateEnrollmentStatus,
  markAttendance,
  getAttendance,
  updateWatchLog,
  getWatchLogs,
};

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

// Helper to generate unique student ID
const generateStudentId = async () => {
  // Find the last student ID starting with 'S1'
  const lastUser = await prisma.user.findFirst({
    where: {
      studentId: {
        startsWith: 'S1'
      }
    },
    orderBy: {
      studentId: 'desc'
    },
    select: { studentId: true }
  });

  if (!lastUser || !lastUser.studentId) {
    return 'S1001';
  }

  // Extract number part
  const numericPart = parseInt(lastUser.studentId.substring(2)); // Remove 'S1'
  if (isNaN(numericPart)) return 'S1001'; // Fallback

  const nextId = numericPart + 1;
  return `S1${nextId}`;
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
    totalFees: enrollmentDetails.totalFees || 0,
    originalFees: enrollmentDetails.originalFees || null,
    paymentMode: enrollmentDetails.paymentMode || 'Online', // CRITICAL: Default to Online if not specified
    paymentOption: enrollmentDetails.paymentOption,

    // Referral
    referralCode: enrollmentDetails.referralCode || null,
    referralAmount: enrollmentDetails.referralAmount || 0,

    // Payment in Advance - advance amount field
    advanceAmount: enrollmentDetails.advanceAmount || null,

    // Installments - Sanitize empty strings to null
    installment1Amount: (enrollmentDetails.paymentPlan?.inst1 === "" || enrollmentDetails.paymentPlan?.inst1 === undefined) ? null : enrollmentDetails.paymentPlan?.inst1,
    installment2Amount: (enrollmentDetails.paymentPlan?.inst2 === "" || enrollmentDetails.paymentPlan?.inst2 === undefined) ? null : enrollmentDetails.paymentPlan?.inst2,
    installment3Amount: (enrollmentDetails.paymentPlan?.inst3 === "" || enrollmentDetails.paymentPlan?.inst3 === undefined) ? null : enrollmentDetails.paymentPlan?.inst3,

    installment2Date: (enrollmentDetails.paymentPlan?.dueDate2 === "" || enrollmentDetails.paymentPlan?.dueDate2 === undefined) ? null : enrollmentDetails.paymentPlan?.dueDate2,
    installment3Date: (enrollmentDetails.paymentPlan?.dueDate3 === "" || enrollmentDetails.paymentPlan?.dueDate3 === undefined) ? null : enrollmentDetails.paymentPlan?.dueDate3,
  };

  // double check for empty strings in decimal fields
  const decimalFields = ['totalFees', 'originalFees', 'referralAmount', 'advanceAmount', 'installment1Amount', 'installment2Amount', 'installment3Amount'];
  decimalFields.forEach(field => {
    if (profileData[field] === "") profileData[field] = null;
  });

  // 1. Find or Create User
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const passwordHash = await bcrypt.hash(contact, 10); // Default password returns to phone number
    const studentId = await generateStudentId(); // Generate ID for new user

    user = await prisma.user.create({
      data: {
        ...profileData,
        email,
        passwordHash,
        studentId, // Assign generated ID
        role: 'STUDENT',
        status: 'INACTIVE', // Default to INACTIVE until verified/batch assigned
        isPreApproved: true // Auto-approve via payment (Wait, if inactive, pre-approved might not matter)
      }
    });
  } else {
    // Check if existing user has studentId, if not generate one
    let updateData = { ...profileData };
    if (!user.studentId) {
      updateData.studentId = await generateStudentId();
    }

    // Update existing user profile with latest info
    user = await prisma.user.update({
      where: { id: user.id },
      data: updateData
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

  // 5. Calculate Payment Amount Based on Payment Option
  let amountToCharge = 0;

  // Determine amount based on payment option
  if (profileData.paymentOption === 'Pay in Full') {
    // Use totalFees (after referral discount)
    amountToCharge = Number(profileData.totalFees || course.price);
  } else if (profileData.paymentOption === 'Payment in Advance') {
    // Use advance amount field
    amountToCharge = Number(profileData.advanceAmount || 0);
  } else if (profileData.paymentOption === 'Pay in Installments') {
    // Use 1st installment amount
    amountToCharge = Number(profileData.installment1Amount || 0);
  } else {
    // Default to total fees
    amountToCharge = Number(profileData.totalFees || course.price);
  }

  // Validate amount
  if (!amountToCharge || amountToCharge <= 0) {
    amountToCharge = Number(course.price);
  }

  // Payment Mode Routing
  // UPI → Razorpay
  // Cash/Bank Transfer → Manual/Offline (no Razorpay)

  if (profileData.paymentMode === 'UPI') {
    // UPI/Online Payment Flow - Create Razorpay Order
    const { order } = await paymentService.createOrder({
      amount: amountToCharge,
      currency: 'INR',
      enrollmentId: enrollment.id
    });

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: config.razorpay.keyId,
      enrollmentId: enrollment.id,
      user: {
        name: user.fullName,
        email: user.email,
        contact: user.contact
      }
    };
  } else if (profileData.paymentMode === 'Cash' || profileData.paymentMode === 'Bank Transfer') {
    // Cash or Bank Transfer - Create manual payment record
    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { id: 'desc' }
    });

    let invoiceNumber = 1001;
    if (lastInvoice && lastInvoice.invoiceNo) {
      const lastNumber = parseInt(lastInvoice.invoiceNo.replace('INV', ''));
      if (!isNaN(lastNumber)) {
        invoiceNumber = lastNumber + 1;
      }
    }

    const invoiceNo = `INV${invoiceNumber}`;

    const payment = await prisma.payment.create({
      data: {
        provider: 'manual',
        orderId: `order_${Date.now()}`,
        providerPaymentId: profileData.referenceNo || null,
        amount: amountToCharge,
        currency: 'INR',
        status: 'INITIATED',
        enrollmentId: enrollment.id
      }
    });

    // Create Invoice
    await prisma.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNo: invoiceNo,
        amount: amountToCharge,
        total: amountToCharge,
        tax: 0
      }
    });

    // Leave Enrollment as PENDING for manual verification and batch assignment
    await prisma.enrollment.update({ where: { id: enrollment.id }, data: { status: 'PENDING' } });

    return {
      success: true,
      message: 'Admission successful',
      enrollmentId: enrollment.id,
      invoiceNo,
      user: {
        name: user.fullName,
        email: user.email,
        contact: user.contact
      }
    };
  }
};

const getEnrollments = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const where = userId ? { userId } : {};

  const enrollments = await prisma.enrollment.findMany({
    where,
    skip: parseInt(skip),
    take: parseInt(limit),
    include: {
      course: true,
      batch: true,
      user: {
        select: {
          id: true,
          studentId: true,
          fullName: true,
          email: true,
          contact: true,

          // Personal Details
          dob: true,
          gender: true,
          address: true,

          // Parent Details
          parentName: true,
          parentContact: true,

          // Academic Details
          currentSchool: true,
          classYear: true,
          educationLevel: true,
          board: true,
          subjects: true,

          // Course & Batch
          batchTiming: true,
          courseName: true,

          // Payment Details
          totalFees: true,
          originalFees: true,
          paymentMode: true,
          paymentOption: true,
          advanceAmount: true,
          referralCode: true,
          referralAmount: true,

          // Installment Details
          installment1Amount: true,
          installment1Date: true,
          installment2Amount: true,
          installment2Date: true,
          installment3Amount: true,
          installment3Date: true
        }
      },
      payments: {
        include: {
          invoice: true
        }
      }
    },
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

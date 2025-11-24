const prisma = require('../config/prisma');

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
  getEnrollments,
  updateEnrollmentStatus,
  markAttendance,
  getAttendance,
  updateWatchLog,
  getWatchLogs,
};

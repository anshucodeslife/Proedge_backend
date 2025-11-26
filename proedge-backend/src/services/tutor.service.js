const prisma = require('../config/prisma');

/**
 * Get tutor's assigned batches
 */
async function getTutorBatches(tutorName) {
  const batches = await prisma.batch.findMany({
    where: {
      tutorName,
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
    orderBy: {
      startDate: 'desc',
    },
  });

  return batches;
}

/**
 * Get students in batch
 */
async function getBatchStudents(batchId) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      batchId,
      status: 'ACTIVE',
    },
    include: {
      user: {
        select: {
          id: true,
          studentId: true,
          email: true,
          fullName: true,
        },
      },
    },
  });

  return enrollments.map(e => e.user);
}

/**
 * Mark attendance (Tutor)
 */
async function markAttendance(batchId, userId, date, status) {
  const attendance = await prisma.attendance.upsert({
    where: {
      userId_batchId_date: {
        userId,
        batchId,
        date,
      },
    },
    update: {
      status,
    },
    create: {
      userId,
      batchId,
      date,
      status,
      autoMarked: false,
    },
  });

  return attendance;
}

/**
 * Get student progress (Tutor view)
 */
async function getStudentProgress(studentId, courseId) {
  const watchLogs = await prisma.watchLog.findMany({
    where: {
      userId: studentId,
      lesson: {
        module: {
          courseId,
        },
      },
    },
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          durationSec: true,
          module: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  const totalWatchedSec = watchLogs.reduce((sum, log) => sum + log.watchedSec, 0);
  const completedLessons = watchLogs.filter(log => log.completed).length;

  return {
    studentId,
    totalWatchedSec,
    completedLessons,
    totalLessons: watchLogs.length,
    lessons: watchLogs.map(log => ({
      lessonId: log.lesson.id,
      lessonTitle: log.lesson.title,
      module: log.lesson.module.title,
      watchedSec: log.watchedSec,
      percentage: log.percentage,
      completed: log.completed,
    })),
  };
}

module.exports = {
  getTutorBatches,
  getBatchStudents,
  markAttendance,
  getStudentProgress,
};

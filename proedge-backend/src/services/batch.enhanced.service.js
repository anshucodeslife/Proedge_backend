const prisma = require('../config/prisma');

/**
 * Assign video to batch+lesson
 */
async function assignBatchVideo(batchId, lessonId, videoUrl) {
  const batchVideo = await prisma.batchVideoMap.upsert({
    where: {
      batchId_lessonId: {
        batchId,
        lessonId,
      },
    },
    update: {
      videoUrl,
    },
    create: {
      batchId,
      lessonId,
      videoUrl,
    },
  });

  return batchVideo;
}

/**
 * Get batch-specific video
 */
async function getBatchVideo(batchId, lessonId) {
  const batchVideo = await prisma.batchVideoMap.findUnique({
    where: {
      batchId_lessonId: {
        batchId,
        lessonId,
      },
    },
  });

  return batchVideo;
}

/**
 * Delete batch video mapping
 */
async function deleteBatchVideo(batchId, lessonId) {
  await prisma.batchVideoMap.delete({
    where: {
      batchId_lessonId: {
        batchId,
        lessonId,
      },
    },
  });

  return { message: 'Batch video mapping deleted' };
}

/**
 * Update watch log with events
 */
async function updateWatchLog(userId, lessonId, data) {
  const { watchedSec, lastPosition, events, completed } = data;

  // Get lesson duration
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { durationSec: true },
  });

  // Calculate percentage
  const percentage = lesson.durationSec > 0 
    ? Math.min((watchedSec / lesson.durationSec) * 100, 100)
    : 0;

  const watchLog = await prisma.watchLog.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
    update: {
      watchedSec,
      lastPosition: lastPosition || watchedSec,
      percentage,
      completed: completed !== undefined ? completed : percentage >= 90,
      events: events || undefined,
      sessionCount: {
        increment: 1,
      },
    },
    create: {
      userId,
      lessonId,
      watchedSec,
      lastPosition: lastPosition || watchedSec,
      percentage,
      completed: completed !== undefined ? completed : percentage >= 90,
      events,
      sessionCount: 1,
    },
  });

  return watchLog;
}

/**
 * Auto-mark attendance based on watch percentage
 */
async function autoMarkAttendance(userId, date, watchPercent) {
  // Get user's active enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      batchId: { not: null },
    },
    select: {
      batchId: true,
    },
  });

  const results = [];

  for (const enrollment of enrollments) {
    // Check if attendance already exists
    const existing = await prisma.attendance.findFirst({
      where: {
        userId,
        batchId: enrollment.batchId,
        date,
      },
    });

    if (!existing) {
      // Auto-mark attendance if watch percent >= 70%
      const status = watchPercent >= 70 ? 'PRESENT' : 'ABSENT';

      const attendance = await prisma.attendance.create({
        data: {
          userId,
          batchId: enrollment.batchId,
          date,
          status,
          autoMarked: true,
          watchPercent,
        },
      });

      results.push(attendance);
    }
  }

  return results;
}

/**
 * Override attendance (Admin/Tutor)
 */
async function overrideAttendance(attendanceId, status, overriddenBy, overrideNote) {
  const attendance = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      status,
      overriddenBy,
      overrideNote,
      autoMarked: false,
    },
  });

  return attendance;
}

module.exports = {
  assignBatchVideo,
  getBatchVideo,
  deleteBatchVideo,
  updateWatchLog,
  autoMarkAttendance,
  overrideAttendance,
};

const prisma = require('../config/prisma');
const s3Service = require('./s3.service');

/**
 * Get student's enrolled courses
 */
async function getEnrolledCourses(userId) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnail: true,
          price: true,
        },
      },
      batch: {
        select: {
          id: true,
          name: true,
          tutorName: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: {
      enrolledAt: 'desc',
    },
  });

  return enrollments;
}

/**
 * Get course details for enrolled student
 */
async function getCourseDetails(userId, courseId) {
  // Verify enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: 'ACTIVE',
    },
    include: {
      batch: true,
    },
  });

  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  // Get course with modules
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
    },
  });

  return {
    course,
    enrollment,
  };
}

/**
 * Get modules for enrolled course
 */
async function getCourseModules(userId, courseId) {
  // Verify enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: 'ACTIVE',
    },
  });

  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  const modules = await prisma.module.findMany({
    where: { courseId },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
          durationSec: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  return modules;
}

/**
 * Get lesson details with batch-specific video URL
 */
async function getLessonDetails(userId, lessonId) {
  // Get lesson
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!lesson) {
    throw new Error('Lesson not found');
  }

  // Verify enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId: lesson.module.courseId,
      status: 'ACTIVE',
    },
    include: {
      batch: true,
    },
  });

  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  // Check for batch-specific video
  let videoUrl = lesson.videoUrl;
  
  if (enrollment.batchId) {
    const batchVideo = await prisma.batchVideoMap.findUnique({
      where: {
        batchId_lessonId: {
          batchId: enrollment.batchId,
          lessonId: lesson.id,
        },
      },
    });

    if (batchVideo) {
      videoUrl = batchVideo.videoUrl;
    }
  }

  // Generate signed URL if video exists
  let signedUrl = null;
  if (videoUrl) {
    // Extract S3 key from URL (assuming format: s3://bucket/key or https://...)
    const key = videoUrl.replace(/^s3:\/\/[^\/]+\//, '');
    signedUrl = await s3Service.getSignedUrl(key);
  }

  // Get watch progress
  const watchLog = await prisma.watchLog.findUnique({
    where: {
      userId_lessonId: {
        userId,
        lessonId,
      },
    },
  });

  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      durationSec: lesson.durationSec,
      attachments: lesson.attachments,
      videoUrl: signedUrl,
    },
    progress: watchLog ? {
      watchedSec: watchLog.watchedSec,
      lastPosition: watchLog.lastPosition,
      percentage: watchLog.percentage,
      completed: watchLog.completed,
    } : null,
  };
}

/**
 * Get course progress for student
 */
async function getCourseProgress(userId, courseId) {
  // Verify enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId,
      status: 'ACTIVE',
    },
  });

  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  // Get all lessons in course
  const lessons = await prisma.lesson.findMany({
    where: {
      module: {
        courseId,
      },
    },
    select: {
      id: true,
      title: true,
      durationSec: true,
      order: true,
      module: {
        select: {
          id: true,
          title: true,
          order: true,
        },
      },
    },
    orderBy: [
      { module: { order: 'asc' } },
      { order: 'asc' },
    ],
  });

  // Get watch logs for all lessons
  const watchLogs = await prisma.watchLog.findMany({
    where: {
      userId,
      lessonId: {
        in: lessons.map(l => l.id),
      },
    },
  });

  const watchLogMap = new Map(watchLogs.map(log => [log.lessonId, log]));

  // Calculate progress
  const totalLessons = lessons.length;
  const completedLessons = watchLogs.filter(log => log.completed).length;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // Find next lesson (first incomplete lesson)
  const nextLesson = lessons.find(lesson => {
    const log = watchLogMap.get(lesson.id);
    return !log || !log.completed;
  });

  // Calculate total watch time
  const totalWatchedSec = watchLogs.reduce((sum, log) => sum + log.watchedSec, 0);

  return {
    totalLessons,
    completedLessons,
    progressPercentage: Math.round(progressPercentage * 100) / 100,
    totalWatchedSec,
    nextLesson: nextLesson ? {
      id: nextLesson.id,
      title: nextLesson.title,
      module: nextLesson.module.title,
    } : null,
    lessons: lessons.map(lesson => {
      const log = watchLogMap.get(lesson.id);
      return {
        id: lesson.id,
        title: lesson.title,
        module: lesson.module.title,
        durationSec: lesson.durationSec,
        completed: log?.completed || false,
        watchedSec: log?.watchedSec || 0,
        percentage: log?.percentage || 0,
      };
    }),
  };
}

module.exports = {
  getEnrolledCourses,
  getCourseDetails,
  getCourseModules,
  getLessonDetails,
  getCourseProgress,
};

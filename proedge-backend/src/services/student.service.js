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
          _count: {
            select: {
              modules: true,
            },
          },
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

  // Get total lessons and progress for each course
  const coursesWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      // Get total lessons in course
      const totalLessons = await prisma.lesson.count({
        where: {
          module: {
            courseId: enrollment.courseId,
          },
        },
      });

      // Get completed lessons
      const completedLessons = await prisma.watchLog.count({
        where: {
          userId,
          completed: true,
          lesson: {
            module: {
              courseId: enrollment.courseId,
            },
          },
        },
      });

      // Calculate progress percentage
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      // Format thumbnail URL
      const thumbnailUrl = enrollment.course.thumbnail
        ? `https://proedge-lms.s3.ap-south-1.amazonaws.com/${enrollment.course.thumbnail}`
        : null;

      return {
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        description: enrollment.course.description || 'No description available',
        thumbnail: thumbnailUrl,
        price: enrollment.course.price,
        totalLessons,
        progress,
        enrolledAt: enrollment.enrolledAt,
        batch: enrollment.batch,
      };
    })
  );

  return coursesWithProgress;
}

/**
 * Get course details for enrolled student
 */
async function getCourseDetails(userId, courseId) {
  if (!userId) throw new Error('User ID is required');

  // Verify enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId: parseInt(courseId),
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
    where: { id: parseInt(courseId) },
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
  if (!userId) throw new Error('User ID is required');

  // Verify enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId: parseInt(courseId),
      status: 'ACTIVE',
    },
  });

  if (!enrollment) {
    throw new Error('Not enrolled in this course');
  }

  const modules = await prisma.module.findMany({
    where: { courseId: parseInt(courseId) },
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
  if (!userId) throw new Error('User ID is required');

  // Get lesson
  const lesson = await prisma.lesson.findUnique({
    where: { id: parseInt(lessonId) },
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
        lessonId: parseInt(lessonId),
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
  if (!userId) throw new Error('User ID is required');

  // Verify enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      courseId: parseInt(courseId),
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
        courseId: parseInt(courseId),
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

/**
 * Get student profile
 */
async function getProfile(userId) {
  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      studentId: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      studentIdVerified: true,
      isPreApproved: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  return student;
}

/**
 * Update student profile
 */
async function updateProfile(userId, data) {
  const { fullName, email } = data;

  // Check if email is already taken by another user
  if (email) {
    const existing = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId },
      },
    });

    if (existing) {
      throw new Error('Email already in use');
    }
  }

  const student = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(fullName && { fullName }),
      ...(email && { email }),
    },
    select: {
      id: true,
      studentId: true,
      email: true,
      fullName: true,
      status: true,
      updatedAt: true,
    },
  });

  return student;
}

/**
 * Change student password
 */
async function changePassword(userId, oldPassword, newPassword) {
  const bcrypt = require('bcryptjs');

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify old password
  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { message: 'Password changed successfully' };
}

/**
 * Get student attendance records
 */
async function getAttendance(userId) {
  const attendance = await prisma.attendance.findMany({
    where: { userId },
    include: {
      batch: {
        select: {
          id: true,
          name: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  return attendance;
}

/**
 * Get student payment history
 */
async function getPayments(userId) {
  const payments = await prisma.payment.findMany({
    where: {
      enrollment: {
        userId,
      },
    },
    include: {
      enrollment: {
        select: {
          id: true,
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      invoice: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return payments;
}

module.exports = {
  getEnrolledCourses,
  getCourseDetails,
  getCourseModules,
  getLessonDetails,
  getCourseProgress,
  getProfile,
  updateProfile,
  changePassword,
  getAttendance,
  getPayments,
};

const prisma = require('../config/prisma');

// LMS Service - Module and Lesson CRUD operations
// Module CRUD
const createModule = async (data) => {
  const { title, order, courseId } = data;
  return await prisma.module.create({
    data: { title, order: Number(order), courseId: Number(courseId) },
  });
};

const getAllModules = async (courseId) => {
  const where = courseId ? { courseId: Number(courseId) } : {};
  return await prisma.module.findMany({
    where,
    include: { lessons: true },
    orderBy: { order: 'asc' },
  });
};

const getModulesByCourse = async (courseId) => {
  return await getAllModules(courseId);
};

const updateModule = async (id, data) => {
  return await prisma.module.update({
    where: { id },
    data,
  });
};

// Lesson CRUD
const createLesson = async (data) => {
  const { title, order, moduleId, videoUrl, durationSec, attachments } = data;
  return await prisma.lesson.create({
    data: { title, order: Number(order), moduleId: Number(moduleId), videoUrl, durationSec: Number(durationSec), attachments },
  });
};

const getLessonsByModule = async (moduleId) => {
  return await prisma.lesson.findMany({
    where: { moduleId },
    orderBy: { order: 'asc' },
  });
};

const updateLesson = async (id, data) => {
  // Filter out fields that don't exist in the Lesson model
  const { type, id: lessonId, createdAt, updatedAt, module, ...validData } = data;

  // Convert numeric fields
  const updateData = {
    ...validData,
    ...(validData.order !== undefined && { order: Number(validData.order) }),
    ...(validData.moduleId !== undefined && { moduleId: Number(validData.moduleId) }),
    ...(validData.durationSec !== undefined && { durationSec: Number(validData.durationSec) }),
  };

  return await prisma.lesson.update({
    where: { id },
    data: updateData,
  });
};

// Batch CRUD
const createBatch = async (data) => {
  const { name, tutorName, courseId, priceOverride, startDate, endDate } = data;
  return await prisma.batch.create({
    data: { name, tutorName, courseId: Number(courseId), priceOverride, startDate, endDate },
  });
};

const getBatches = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const batches = await prisma.batch.findMany({
    skip: parseInt(skip),
    take: parseInt(limit),
    include: { course: true },
  });
  const total = await prisma.batch.count();
  return { batches, total, page, limit };
};

const updateBatch = async (id, data) => {
  return await prisma.batch.update({
    where: { id },
    data,
  });
};

/**
 * Delete module
 */
async function deleteModule(id) {
  // Check if module has lessons with student progress (watch logs)
  const lessonsWithProgress = await prisma.lesson.findMany({
    where: {
      moduleId: id,
      watchLogs: {
        some: {}
      }
    },
    include: {
      _count: {
        select: { watchLogs: true }
      }
    }
  });

  // If there are lessons with student watch logs, prevent deletion
  if (lessonsWithProgress.length > 0) {
    const totalWatchLogs = lessonsWithProgress.reduce((sum, lesson) => sum + lesson._count.watchLogs, 0);
    throw new Error(
      `Cannot delete this module because it contains ${lessonsWithProgress.length} lesson(s) with ${totalWatchLogs} student progress record(s). ` +
      `Students have already started watching these lessons. Please archive the module instead of deleting it.`
    );
  }

  // Delete all dependencies in a transaction
  await prisma.$transaction(async (tx) => {
    // Get all lesson IDs in this module
    const lessons = await tx.lesson.findMany({
      where: { moduleId: id },
      select: { id: true }
    });
    const lessonIds = lessons.map(l => l.id);

    if (lessonIds.length > 0) {
      // Delete batch video mappings for these lessons
      await tx.batchVideoMap.deleteMany({
        where: { lessonId: { in: lessonIds } }
      });

      // Delete any remaining watch logs (shouldn't be any due to check above)
      await tx.watchLog.deleteMany({
        where: { lessonId: { in: lessonIds } }
      });
    }

    // Delete all lessons in this module
    await tx.lesson.deleteMany({
      where: { moduleId: id },
    });

    // Now delete the module
    await tx.module.delete({
      where: { id },
    });
  });

  return { message: 'Module and associated lessons deleted successfully' };
}

/**
 * Delete lesson
 */
async function deleteLesson(id) {
  await prisma.lesson.delete({
    where: { id },
  });

  return { message: 'Lesson deleted successfully' };
}

/**
 * Delete batch
 */
async function deleteBatch(id) {
  await prisma.batch.delete({
    where: { id },
  });

  return { message: 'Batch deleted successfully' };
}

module.exports = {
  createModule,
  getAllModules,
  getModulesByCourse,
  updateModule,
  createLesson,
  getLessonsByModule,
  updateLesson,
  createBatch,
  getBatches,
  updateBatch,
  deleteModule,
  deleteLesson,
  deleteBatch,
};

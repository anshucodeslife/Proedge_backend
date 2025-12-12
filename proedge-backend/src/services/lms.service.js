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
    include: {
      course: true,
      _count: { select: { enrollments: { where: { status: 'ACTIVE' } } } }
    },
  });
  const total = await prisma.batch.count();
  return { batches, total, page, limit };
};

const getBatchStudents = async (batchId) => {
  return await prisma.enrollment.findMany({
    where: {
      batchId: Number(batchId),
      status: 'ACTIVE'
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          studentId: true,
          contact: true,
          status: true
        }
      }
    }
  });
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

      // Delete any watch logs
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
  await prisma.$transaction(async (tx) => {
    // Delete batch video mappings
    await tx.batchVideoMap.deleteMany({
      where: { lessonId: id }
    });

    // Delete watch logs
    await tx.watchLog.deleteMany({
      where: { lessonId: id }
    });

    // Delete the lesson
    await tx.lesson.delete({
      where: { id },
    });
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
  getBatchStudents,
  updateBatch,
  deleteModule,
  deleteLesson,
  deleteBatch,
};

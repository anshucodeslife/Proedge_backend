const prisma = require('../config/prisma');

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
  return await prisma.lesson.update({
    where: { id },
    data,
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
  // Prisma will handle cascade delete for lessons through onDelete: Cascade
  await prisma.module.delete({
    where: { id },
  });

  return { message: 'Module deleted successfully' };
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

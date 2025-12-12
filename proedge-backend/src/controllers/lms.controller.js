const lmsService = require('../services/lms.service');
const { success } = require('../utils/response');

// Module controllers
const createModule = async (req, res, next) => {
  try {
    const result = await lmsService.createModule(req.body);
    success(res, result, 'Module created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getAllModules = async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const result = await lmsService.getAllModules(courseId ? Number(courseId) : undefined);
    success(res, result, 'Modules fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getModulesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const result = await lmsService.getModulesByCourse(Number(courseId));
    success(res, result, 'Modules fetched successfully');
  } catch (err) {
    next(err);
  }
};

const updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await lmsService.updateModule(id, req.body);
    success(res, result, 'Module updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await lmsService.deleteModule(Number(id));
    success(res, result, 'Module deleted successfully');
  } catch (err) {
    next(err);
  }
};

// Lesson controllers
const createLesson = async (req, res, next) => {
  try {
    const result = await lmsService.createLesson(req.body);
    success(res, result, 'Lesson created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getLessonsByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const result = await lmsService.getLessonsByModule(moduleId);
    success(res, result, 'Lessons fetched successfully');
  } catch (err) {
    next(err);
  }
};

const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await lmsService.updateLesson(Number(id), req.body);
    success(res, result, 'Lesson updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await lmsService.deleteLesson(Number(id));
    success(res, result, 'Lesson deleted successfully');
  } catch (err) {
    next(err);
  }
};

// Batch controllers
const createBatch = async (req, res, next) => {
  try {
    const result = await lmsService.createBatch(req.body);
    success(res, result, 'Batch created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getBatches = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await lmsService.getBatches(page, limit);
    success(res, result, 'Batches fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getBatchStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await lmsService.getBatchStudents(id);
    success(res, result, 'Batch students fetched successfully');
  } catch (err) {
    next(err);
  }
};

const updateBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await lmsService.updateBatch(Number(id), req.body);
    success(res, result, 'Batch updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await lmsService.deleteBatch(Number(id));
    success(res, result, 'Batch deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createModule,
  getAllModules,
  getModulesByCourse,
  updateModule,
  deleteModule,
  createLesson,
  getLessonsByModule,
  updateLesson,
  deleteLesson,
  createBatch,
  getBatches,
  getBatchStudents,
  updateBatch,
  deleteBatch,
};

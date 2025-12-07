const courseService = require('../services/course.service');
const { success } = require('../utils/response');

const createCourse = async (req, res, next) => {
  try {
    const result = await courseService.createCourse(req.body);
    success(res, result, 'Course created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getCourses = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await courseService.getCourses(page, limit);
    success(res, result, 'Courses fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getCourseBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    let result;

    // Check if the identifier is a number (ID)
    if (!isNaN(slug) && !isNaN(parseFloat(slug))) {
      result = await courseService.getCourseById(slug);
    } else {
      // Otherwise treat as slug
      result = await courseService.getCourseBySlug(slug);
    }

    success(res, result, 'Course fetched successfully');
  } catch (err) {
    next(err);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await courseService.updateCourse(Number(id), req.body);
    success(res, result, 'Course updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    await courseService.deleteCourse(Number(id));
    success(res, null, 'Course deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCourseBySlug,
  updateCourse,
  deleteCourse,
};

const adminCourseService = require('../services/admin.course.service');

/**
 * Get all courses with pagination
 */
async function getAllCourses(req, res, next) {
  try {
    const { page, limit, search, sortBy, sortOrder } = req.query;
    
    const result = await adminCourseService.getAllCourses({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    });
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get course by ID
 */
async function getCourseById(req, res, next) {
  try {
    const { id } = req.params;
    
    const course = await adminCourseService.getCourseById(id);
    
    res.status(200).json({
      success: true,
      data: { course },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get course students
 */
async function getCourseStudents(req, res, next) {
  try {
    const { id } = req.params;
    
    const students = await adminCourseService.getCourseStudents(id);
    
    res.status(200).json({
      success: true,
      data: { students },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllCourses,
  getCourseById,
  getCourseStudents,
};

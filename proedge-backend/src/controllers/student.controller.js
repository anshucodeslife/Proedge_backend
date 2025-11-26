const studentService = require('../services/student.service');

/**
 * Get enrolled courses
 */
async function getEnrolledCourses(req, res, next) {
  try {
    const userId = req.user.userId;
    
    const courses = await studentService.getEnrolledCourses(userId);
    
    res.status(200).json({
      success: true,
      message: 'Enrolled courses fetched successfully',
      data: { courses },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get course details
 */
async function getCourseDetails(req, res, next) {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    
    const result = await studentService.getCourseDetails(userId, courseId);
    
    res.status(200).json({
      success: true,
      message: 'Course details fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get course modules
 */
async function getCourseModules(req, res, next) {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    
    const modules = await studentService.getCourseModules(userId, courseId);
    
    res.status(200).json({
      success: true,
      message: 'Modules fetched successfully',
      data: { modules },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get lesson details with video
 */
async function getLessonDetails(req, res, next) {
  try {
    const userId = req.user.userId;
    const { lessonId } = req.params;
    
    const result = await studentService.getLessonDetails(userId, lessonId);
    
    res.status(200).json({
      success: true,
      message: 'Lesson details fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get course progress
 */
async function getCourseProgress(req, res, next) {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    
    const progress = await studentService.getCourseProgress(userId, courseId);
    
    res.status(200).json({
      success: true,
      message: 'Course progress fetched successfully',
      data: { progress },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEnrolledCourses,
  getCourseDetails,
  getCourseModules,
  getLessonDetails,
  getCourseProgress,
};

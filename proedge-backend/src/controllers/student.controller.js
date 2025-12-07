const studentService = require('../services/student.service');

/**
 * Get enrolled courses
 */
async function getEnrolledCourses(req, res, next) {
  try {
    const userId = req.user.id;

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
    const userId = req.user.id;
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
    const userId = req.user.id;
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
    const userId = req.user.id;
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
    const userId = req.user.id;
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

/**
 * Get student profile
 */
async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const profile = await studentService.getProfile(userId);

    res.status(200).json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update student profile
 */
async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const data = req.body;

    const profile = await studentService.updateProfile(userId, data);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change password
 */
async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const result = await studentService.changePassword(userId, oldPassword, newPassword);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get attendance records
 */
async function getAttendance(req, res, next) {
  try {
    const userId = req.user.id;

    const attendance = await studentService.getAttendance(userId);

    res.status(200).json({
      success: true,
      data: { attendance },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get payment history
 */
async function getPayments(req, res, next) {
  try {
    const userId = req.user.id;

    const payments = await studentService.getPayments(userId);

    res.status(200).json({
      success: true,
      data: { payments },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update watch progress for a lesson
 */
async function updateWatchProgress(req, res, next) {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;
    const { watchedSec, lastPosition, completed } = req.body;

    const result = await studentService.updateWatchProgress(
      userId,
      lessonId,
      watchedSec,
      lastPosition,
      completed
    );

    res.status(200).json({
      success: true,
      message: 'Watch progress updated successfully',
      data: result,
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
  getProfile,
  updateProfile,
  changePassword,
  getAttendance,
  getPayments,
  updateWatchProgress,
};

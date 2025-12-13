const enrollmentService = require('../services/enrollment.service');
const { success } = require('../utils/response');

// Enrollment controllers
const enrollStudent = async (req, res, next) => {
  try {
    const result = await enrollmentService.enrollStudent(req.body);
    success(res, result, 'Enrollment created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const initiateEnrollment = async (req, res, next) => {
  try {
    console.log("In initiateEnrollment Controller", req.body);
    const result = await enrollmentService.initiateEnrollment(req.body);
    success(res, result, 'Order created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getEnrollments = async (req, res, next) => {
  try {
    let { userId, page, limit } = req.query;

    // Security: If user is not ADMIN, restrict to their own enrollments
    if (req.user.role !== 'ADMIN') {
      userId = req.user.id;
    }

    const result = await enrollmentService.getEnrollments(userId, page, limit);
    success(res, result, 'Enrollments fetched successfully');
  } catch (err) {
    next(err);
  }
};

const updateEnrollmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await enrollmentService.updateEnrollmentStatus(Number(id), status);
    success(res, result, 'Enrollment status updated successfully');
  } catch (err) {
    next(err);
  }
};

// Attendance controllers
const markAttendance = async (req, res, next) => {
  try {
    const result = await enrollmentService.markAttendance(req.body);
    success(res, result, 'Attendance marked successfully');
  } catch (err) {
    next(err);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    const { userId, batchId } = req.query;
    const result = await enrollmentService.getAttendance(userId, batchId);
    success(res, result, 'Attendance fetched successfully');
  } catch (err) {
    next(err);
  }
};

// WatchLog controllers
const updateWatchLog = async (req, res, next) => {
  try {
    const result = await enrollmentService.updateWatchLog(req.body);
    success(res, result, 'Watch log updated successfully');
  } catch (err) {
    next(err);
  }
};

const getWatchLogs = async (req, res, next) => {
  try {
    const { userId, lessonId } = req.query;
    const result = await enrollmentService.getWatchLogs(userId, lessonId);
    success(res, result, 'Watch logs fetched successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  enrollStudent,
  initiateEnrollment,
  getEnrollments,
  updateEnrollmentStatus,
  markAttendance,
  getAttendance,
  updateWatchLog,
  getWatchLogs,
};

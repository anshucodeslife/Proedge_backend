const adminService = require('../services/admin.service');
const adminHelperService = require('../services/admin.helper.service');
const { success } = require('../utils/response');

const getOverviewStats = async (req, res, next) => {
  try {
    const result = await adminService.getOverviewStats();
    success(res, result, 'Overview stats fetched successfully');
  } catch (err) {
    next(err);
  }
};

const getVideoEngagement = async (req, res, next) => {
  try {
    const result = await adminService.getVideoEngagement();
    success(res, result, 'Video engagement report fetched successfully');
  } catch (err) {
    next(err);
  }
};

const searchStudents = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    const students = await adminHelperService.searchStudents(q, limit ? Number(limit) : 20);
    success(res, students, 'Students found');
  } catch (err) {
    next(err);
  }
};

const assignCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userIds, batchId } = req.body;
    const result = await adminHelperService.assignCourseToStudents(
      Number(id),
      userIds,
      batchId ? Number(batchId) : null
    );
    success(res, result, 'Course assignment completed', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOverviewStats,
  getVideoEngagement,
  searchStudents,
  assignCourse,
};

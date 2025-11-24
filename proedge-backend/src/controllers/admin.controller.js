const adminService = require('../services/admin.service');
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

module.exports = {
  getOverviewStats,
  getVideoEngagement,
};

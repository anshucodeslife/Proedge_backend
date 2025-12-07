const attendanceService = require('../services/attendance.service');
const { success, error } = require('../utils/response');

/**
 * Upload attendance via Excel file
 * POST /api/admin/attendance/upload
 */
const uploadAttendance = async (req, res, next) => {
    try {
        const { date, attendanceData } = req.body;

        if (!date || !attendanceData || !Array.isArray(attendanceData)) {
            return error(res, 'Invalid request. Provide date and attendanceData array', 400);
        }

        const result = await attendanceService.bulkCreateAttendance(date, attendanceData);
        success(res, result, 'Attendance uploaded successfully', 201);
    } catch (err) {
        next(err);
    }
};

/**
 * Get attendance records
 * GET /api/admin/attendance
 */
const getAttendance = async (req, res, next) => {
    try {
        const { userId, batchId, startDate, endDate } = req.query;
        const result = await attendanceService.getAttendance({
            userId: userId ? Number(userId) : undefined,
            batchId: batchId ? Number(batchId) : undefined,
            startDate,
            endDate,
        });
        success(res, result, 'Attendance fetched successfully');
    } catch (err) {
        next(err);
    }
};

/**
 * Update single attendance record
 * PUT /api/admin/attendance/:id
 */
const updateAttendance = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await attendanceService.updateAttendance(Number(id), req.body);
        success(res, result, 'Attendance updated successfully');
    } catch (err) {
        next(err);
    }
};

/**
 * Delete attendance record
 * DELETE /api/admin/attendance/:id
 */
const deleteAttendance = async (req, res, next) => {
    try {
        const { id } = req.params;
        await attendanceService.deleteAttendance(Number(id));
        success(res, null, 'Attendance deleted successfully');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    uploadAttendance,
    getAttendance,
    updateAttendance,
    deleteAttendance,
};

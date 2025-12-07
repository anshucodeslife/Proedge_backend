const adminStudentService = require('../services/admin.student.service');
const multer = require('multer');
const path = require('path');

// Configure multer for CSV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `students-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * Get all students
 */
async function getAllStudents(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;
    const courseId = req.query.courseId;
    const batchId = req.query.batchId;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    const result = await adminStudentService.getAllStudents({ page, limit, search, status, courseId, batchId, sortBy, sortOrder });

    res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get student by ID
 */
async function getStudentById(req, res, next) {
  try {
    const { id } = req.params;
    const student = await adminStudentService.getStudentById(Number(id));
    res.status(200).json({
      success: true,
      data: { student },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create student
 */
async function createStudent(req, res, next) {
  try {
    const { studentId, email, password, fullName, isPreApproved } = req.body;

    const student = await adminStudentService.createStudent({
      studentId,
      email,
      password,
      fullName,
      isPreApproved,
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { student },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update student
 */
async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const data = req.body;

    const student = await adminStudentService.updateStudent(Number(id), data);

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: { student },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete student
 */
async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query;

    const result = await adminStudentService.deleteStudent(Number(id), hardDelete === 'true');

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign student to course
 */
async function assignToCourse(req, res, next) {
  try {
    const { id } = req.params;
    const { courseId, batchId } = req.body;

    const enrollment = await adminStudentService.assignToCourse(Number(id), Number(courseId), batchId ? Number(batchId) : undefined);

    res.status(201).json({
      success: true,
      message: 'Student assigned to course successfully',
      data: { enrollment },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign student to batch
 */
async function assignToBatch(req, res, next) {
  try {
    const { id } = req.params;
    const { batchId } = req.body;

    const enrollment = await adminStudentService.assignToBatch(Number(id), Number(batchId));

    res.status(200).json({
      success: true,
      message: 'Student assigned to batch successfully',
      data: { enrollment },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk upload students
 */
async function bulkUpload(req, res, next) {
  try {
    if (!req.file) {
      throw new Error('CSV file is required');
    }

    const results = await adminStudentService.bulkUploadStudents(req.file.path);

    res.status(200).json({
      success: true,
      message: 'Bulk upload completed',
      data: {
        successCount: results.success.length,
        failedCount: results.failed.length,
        success: results.success,
        failed: results.failed,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add pre-approved student
 */
async function addPreApproved(req, res, next) {
  try {
    const { studentId, fullName, email, phone } = req.body;

    const preApproved = await adminStudentService.addPreApprovedStudent({
      studentId,
      fullName,
      email,
      phone,
    });

    res.status(201).json({
      success: true,
      message: 'Pre-approved student added successfully',
      data: { preApproved },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all pre-approved students
 */
async function getPreApproved(req, res, next) {
  try {
    const preApproved = await adminStudentService.getAllPreApproved();

    res.status(200).json({
      success: true,
      data: { preApproved },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get student enrollments
 */
async function getStudentEnrollments(req, res, next) {
  try {
    const { id } = req.params;
    const enrollments = await adminStudentService.getStudentEnrollments(Number(id));
    res.status(200).json({ success: true, data: { enrollments } });
  } catch (error) {
    next(error);
  }
}

/**
 * Get student progress
 */
async function getStudentProgress(req, res, next) {
  try {
    const { id } = req.params;
    const { courseId } = req.query;
    const progress = await adminStudentService.getStudentProgress(Number(id), courseId ? Number(courseId) : undefined);
    res.status(200).json({ success: true, data: { progress } });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove enrollment
 */
async function removeEnrollment(req, res, next) {
  try {
    const { enrollmentId } = req.params;
    await adminStudentService.removeEnrollment(Number(enrollmentId));
    res.status(200).json({ success: true, message: 'Enrollment removed' });
  } catch (error) {
    next(error);
  }
}

/**
 * Update student status
 */
async function updateStudentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const student = await adminStudentService.updateStudentStatus(Number(id), status);
    res.status(200).json({ success: true, data: { student } });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset password
 */
async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    await adminStudentService.resetStudentPassword(Number(id), newPassword);
    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete pre-approved student
 */
async function deletePreApproved(req, res, next) {
  try {
    const { id } = req.params;
    await adminStudentService.deletePreApproved(Number(id));
    res.status(200).json({ success: true, message: 'Pre-approved student deleted' });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk status update
 */
async function bulkStatusUpdate(req, res, next) {
  try {
    const { studentIds, status } = req.body;
    const result = await adminStudentService.bulkUpdateStatus(studentIds, status);
    res.status(200).json({
      success: true,
      message: result.message,
      data: { count: result.count },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk assign to course
 */
async function bulkAssignCourse(req, res, next) {
  try {
    const { studentIds, courseId, batchId } = req.body;
    const results = await adminStudentService.bulkAssignToCourse(studentIds, courseId, batchId);
    res.status(200).json({
      success: true,
      message: 'Bulk assignment completed',
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createStudent,
  updateStudent,
  deleteStudent,
  assignToCourse,
  assignToBatch,
  bulkUpload,
  addPreApproved,
  upload,
  getAllStudents,
  getStudentById,
  getStudentEnrollments,
  getStudentProgress,
  removeEnrollment,
  updateStudentStatus,
  resetPassword,
  getPreApproved,
  deletePreApproved,
  bulkStatusUpdate,
  bulkAssignCourse,
};

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
    
    const student = await adminStudentService.updateStudent(id, data);
    
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
    
    const result = await adminStudentService.deleteStudent(id, hardDelete === 'true');
    
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
    
    const enrollment = await adminStudentService.assignToCourse(id, courseId, batchId);
    
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
    
    const enrollment = await adminStudentService.assignToBatch(id, batchId);
    
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

module.exports = {
  createStudent,
  updateStudent,
  deleteStudent,
  assignToCourse,
  assignToBatch,
  bulkUpload,
  addPreApproved,
  upload, // Export multer middleware
};

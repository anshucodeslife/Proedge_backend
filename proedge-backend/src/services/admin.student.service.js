const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const fs = require('fs');

/**
 * Create student (Admin only)
 */
async function createStudent({ studentId, email, password, fullName, isPreApproved = false }) {
  // Check if student ID already exists
  if (studentId) {
    const existing = await prisma.user.findUnique({
      where: { studentId },
    });
    
    if (existing) {
      throw new Error('Student ID already exists');
    }
  }
  
  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingEmail) {
    throw new Error('Email already exists');
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create student
  const student = await prisma.user.create({
    data: {
      studentId,
      email,
      passwordHash,
      fullName,
      role: 'STUDENT',
      isPreApproved,
      studentIdVerified: !!studentId,
    },
    select: {
      id: true,
      studentId: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
  
  return student;
}

/**
 * Update student
 */
async function updateStudent(id, data) {
  const { fullName, email, studentId, status } = data;
  
  const student = await prisma.user.update({
    where: { id },
    data: {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(studentId && { studentId }),
      ...(status && { status }),
    },
    select: {
      id: true,
      studentId: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });
  
  return student;
}

/**
 * Delete/deactivate student
 */
async function deleteStudent(id, hardDelete = false) {
  if (hardDelete) {
    await prisma.user.delete({
      where: { id },
    });
    return { message: 'Student deleted permanently' };
  } else {
    await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    return { message: 'Student deactivated' };
  }
}

/**
 * Assign student to course
 */
async function assignToCourse(studentId, courseId, batchId = null) {
  // Check if already enrolled
  const existing = await prisma.enrollment.findFirst({
    where: {
      userId: studentId,
      courseId,
    },
  });
  
  if (existing) {
    throw new Error('Student already enrolled in this course');
  }
  
  // Create enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: studentId,
      courseId,
      batchId,
      status: 'ACTIVE',
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      batch: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  
  return enrollment;
}

/**
 * Assign student to batch
 */
async function assignToBatch(studentId, batchId) {
  // Get the batch to find the course
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: { course: true },
  });
  
  if (!batch) {
    throw new Error('Batch not found');
  }
  
  // Check if student is enrolled in the course
  let enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: studentId,
      courseId: batch.courseId,
    },
  });
  
  if (!enrollment) {
    // Create enrollment if doesn't exist
    enrollment = await prisma.enrollment.create({
      data: {
        userId: studentId,
        courseId: batch.courseId,
        batchId,
        status: 'ACTIVE',
      },
    });
  } else {
    // Update existing enrollment with batch
    enrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { batchId },
    });
  }
  
  return enrollment;
}

/**
 * Bulk upload students from CSV
 */
async function bulkUploadStudents(filePath) {
  const students = [];
  const errors = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        students.push(row);
      })
      .on('end', async () => {
        const results = {
          success: [],
          failed: [],
        };
        
        for (const student of students) {
          try {
            const created = await createStudent({
              studentId: student.studentId,
              email: student.email,
              password: student.password || 'student123', // Default password
              fullName: student.fullName,
              isPreApproved: true,
            });
            
            results.success.push(created);
          } catch (error) {
            results.failed.push({
              student,
              error: error.message,
            });
          }
        }
        
        resolve(results);
      })
      .on('error', reject);
  });
}

/**
 * Add pre-approved student
 */
async function addPreApprovedStudent({ studentId, fullName, email, phone }) {
  const preApproved = await prisma.preApprovedStudent.create({
    data: {
      studentId,
      fullName,
      email,
      phone,
    },
  });
  
  return preApproved;
}

module.exports = {
  createStudent,
  updateStudent,
  deleteStudent,
  assignToCourse,
  assignToBatch,
  bulkUploadStudents,
  addPreApprovedStudent,
};

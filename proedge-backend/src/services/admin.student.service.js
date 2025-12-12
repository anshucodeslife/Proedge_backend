const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const fs = require('fs');

/**
 * Create student (Admin only)
 */
async function createStudent({ studentId, email, password, fullName, contact, isPreApproved = false }) {
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

  // Hash password (default to contact number if password not provided, fallback to 'student123')
  const defaultPassword = password || contact || 'student123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

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
      contact: contact || null,
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
 * Get all students with pagination and filtering
 */
async function getAllStudents(page = 1, limit = 10, search = '') {
  const skip = (page - 1) * limit;

  const where = {
    role: 'STUDENT',
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [students, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        studentId: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,

        // Extended Profile
        contact: true,
        address: true,
        dob: true,
        gender: true,
        parentName: true,
        parentContact: true,

        // Course/Fee Info
        courseName: true,
        batchTiming: true,
        totalFees: true,
        paidFees: true,
        originalFees: true,
        paymentMode: true,
        paymentOption: true,
        referenceNo: true,

        // Installment Info
        installment1Amount: true,
        installment1Date: true,
        installment1Paid: true,
        installment2Amount: true,
        installment2Date: true,
        installment2Paid: true,
        installment3Amount: true,
        installment3Date: true,
        installment3Paid: true,

        enrollments: {
          select: {
            id: true,
            status: true,
            course: { select: { title: true, price: true } },
            batch: { select: { name: true } },
            payments: {
              select: {
                id: true,
                amount: true,
                status: true,
                orderId: true,
                invoice: {
                  select: {
                    id: true,
                    invoiceNo: true,
                    pdfUrl: true,
                    amount: true
                  }
                }
              }
            }
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    students,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update student
 */
async function updateStudent(id, data) {
  const { fullName, email, studentId, status, contact, dob, gender, address, parentName, parentContact, currentSchool, classYear, educationLevel, board } = data;

  const student = await prisma.user.update({
    where: { id },
    data: {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(studentId && { studentId }),
      ...(status && { status }),
      ...(contact && { contact }),
      ...(dob && { dob }),
      ...(gender && { gender }),
      ...(address && { address }),
      ...(parentName && { parentName }),
      ...(parentContact && { parentContact }),
      ...(currentSchool && { currentSchool }),
      ...(classYear && { classYear }),
      ...(educationLevel && { educationLevel }),
      ...(board && { board }),
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
              password: student.password,
              fullName: student.fullName,
              contact: student.contact || student.phone || student.mobile, // Try common CSV headers
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

/**
 * Get all students with pagination and filtering
 */
async function getAllStudents({ page = 1, limit = 20, search = '', status = '', courseId = '', batchId = '', sortBy = 'createdAt', sortOrder = 'desc' }) {
  const skip = (page - 1) * limit;

  // Build where clause
  const where = {
    role: 'STUDENT',
  };

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { studentId: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (courseId) {
    where.enrollments = {
      some: { courseId },
    };
  }

  if (batchId) {
    where.enrollments = {
      some: { batchId },
    };
  }

  // Get total count
  const total = await prisma.user.count({ where });

  // Get students
  const students = await prisma.user.findMany({
    where,
    skip,
    take: parseInt(limit),
    orderBy: { [sortBy]: sortOrder },
    select: {
      id: true,
      studentId: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      studentIdVerified: true,
      isPreApproved: true,
      createdAt: true,
      updatedAt: true,

      // Extended Profile
      contact: true,
      address: true,
      dob: true,
      gender: true,
      parentName: true,
      parentContact: true,

      // Course/Fee Info
      courseName: true,
      batchTiming: true,
      totalFees: true,
      paidFees: true,
      originalFees: true,
      paymentMode: true,
      paymentOption: true,
      referenceNo: true,

      // Installment Info
      installment1Amount: true,
      installment1Date: true,
      installment1Paid: true,
      installment2Amount: true,
      installment2Date: true,
      installment2Paid: true,
      installment3Amount: true,
      installment3Date: true,
      installment3Paid: true,

      _count: {
        select: {
          enrollments: true,
        },
      },

      enrollments: {
        select: {
          id: true,
          status: true,
          course: { select: { title: true, price: true } },
          batch: { select: { name: true } },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              orderId: true,
              invoice: {
                select: {
                  id: true,
                  invoiceNo: true,
                  pdfUrl: true,
                  amount: true
                }
              }
            }
          }
        },
      },
    },
  });

  return {
    students,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get single student with full details
 */
async function getStudentById(id) {
  const student = await prisma.user.findUnique({
    where: { id },
    include: {
      enrollments: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
            },
          },
          batch: {
            select: {
              id: true,
              name: true,
              tutorName: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
      attendance: {
        select: {
          id: true,
          date: true,
          status: true,
          batchId: true,
        },
        orderBy: { date: 'desc' },
        take: 10,
      },
      notifications: {
        select: {
          id: true,
          title: true,
          message: true,
          read: true,
          sentAt: true,
        },
        orderBy: { sentAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Remove password hash from response
  delete student.passwordHash;
  delete student.otpCode;
  delete student.otpExpiry;

  return student;
}

/**
 * Get student enrollments
 */
async function getStudentEnrollments(studentId) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: studentId },
    include: {
      course: true,
      batch: true,
      payments: true,
    },
  });

  return enrollments;
}

/**
 * Get student progress
 */
async function getStudentProgress(studentId, courseId = null) {
  const where = { userId: studentId };
  if (courseId) {
    where.lesson = {
      module: {
        courseId,
      },
    };
  }

  const watchLogs = await prisma.watchLog.findMany({
    where,
    include: {
      lesson: {
        include: {
          module: {
            select: {
              title: true,
              courseId: true,
            },
          },
        },
      },
    },
  });

  return watchLogs;
}

/**
 * Remove student enrollment
 */
async function removeEnrollment(studentId, enrollmentId) {
  // Verify enrollment belongs to student
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      id: enrollmentId,
      userId: studentId,
    },
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  await prisma.enrollment.delete({
    where: { id: enrollmentId },
  });

  return { message: 'Enrollment removed successfully' };
}

/**
 * Update student status
 */
async function updateStudentStatus(id, status) {
  const student = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
    },
  });

  return student;
}

/**
 * Reset student password (admin action)
 */
async function resetStudentPassword(id, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  return { message: 'Password reset successfully' };
}

/**
 * Get all pre-approved students
 */
async function getAllPreApproved() {
  const preApproved = await prisma.preApprovedStudent.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return preApproved;
}

/**
 * Delete pre-approved student
 */
async function deletePreApproved(id) {
  await prisma.preApprovedStudent.delete({
    where: { id },
  });

  return { message: 'Pre-approved student deleted' };
}

/**
 * Bulk status update
 */
async function bulkUpdateStatus(studentIds, status) {
  const result = await prisma.user.updateMany({
    where: {
      id: { in: studentIds },
      role: 'STUDENT',
    },
    data: { status },
  });

  return {
    message: `Updated ${result.count} students`,
    count: result.count,
  };
}

/**
 * Bulk assign to course
 */
async function bulkAssignToCourse(studentIds, courseId, batchId = null) {
  const results = {
    success: [],
    failed: [],
  };

  for (const studentId of studentIds) {
    try {
      const enrollment = await assignToCourse(studentId, courseId, batchId);
      results.success.push({ studentId, enrollment });
    } catch (error) {
      results.failed.push({ studentId, error: error.message });
    }
  }

  return results;
}

module.exports = {
  createStudent,
  updateStudent,
  deleteStudent,
  assignToCourse,
  assignToBatch,
  bulkUploadStudents,
  addPreApprovedStudent,
  getAllStudents,
  getStudentById,
  getStudentEnrollments,
  getStudentProgress,
  removeEnrollment,
  updateStudentStatus,
  resetStudentPassword,
  getAllPreApproved,
  deletePreApproved,
  bulkUpdateStatus,
  bulkAssignToCourse,
};

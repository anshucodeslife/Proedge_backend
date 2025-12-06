const prisma = require('../config/prisma');

/**
 * Get all courses with pagination (admin view)
 */
async function getAllCourses({ page = 1, limit = 20, search = '', sortBy = 'createdAt', sortOrder = 'desc' }) {
  const skip = (page - 1) * limit;
  
  const where = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  const total = await prisma.course.count({ where });
  
  const courses = await prisma.course.findMany({
    where,
    skip,
    take: parseInt(limit),
    orderBy: { [sortBy]: sortOrder },
    include: {
      _count: {
        select: {
          modules: true,
          enrollments: true,
        },
      },
    },
  });
  
  return {
    courses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get course by ID with full details
 */
async function getCourseById(id) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        include: {
          lessons: true,
        },
      },
      batches: true,
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
  });
  
  if (!course) {
    throw new Error('Course not found');
  }
  
  return course;
}

/**
 * Get enrolled students for a course
 */
async function getCourseStudents(courseId) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: {
      user: {
        select: {
          id: true,
          studentId: true,
          fullName: true,
          email: true,
          status: true,
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
  
  return enrollments;
}

module.exports = {
  getAllCourses,
  getCourseById,
  getCourseStudents,
};

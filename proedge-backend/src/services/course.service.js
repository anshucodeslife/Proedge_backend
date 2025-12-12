const prisma = require('../config/prisma');

const createCourse = async (data) => {
  const {
    title, slug, description, price, mrp, isPaid,
    image, thumbnail, active, validityDays,
    duration, lectures, projects, certificate, access, points
  } = data;

  const existingCourse = await prisma.course.findUnique({ where: { slug } });
  if (existingCourse) {
    throw { statusCode: 400, message: 'Slug already exists' };
  }

  return await prisma.course.create({
    data: {
      title,
      slug,
      description,
      image,
      thumbnail,
      price: price || 0,
      mrp: mrp || 0,
      isPaid: isPaid || false,
      active: active !== undefined ? active : true,
      validityDays,
      duration,
      lectures,
      projects,
      certificate,
      access,
      points,
    },
  });
};

const getCourses = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const courses = await prisma.course.findMany({
    skip: parseInt(skip),
    take: parseInt(limit),
    include: {
      modules: {
        include: { lessons: true },
      },
    },
  });
  const total = await prisma.course.count();
  return { courses, total, page, limit };
};

const getCourseBySlug = async (slug) => {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        include: { lessons: true },
      },
      batches: true,
    },
  });
  if (!course) {
    throw { statusCode: 404, message: 'Course not found' };
  }
  return course;
};

const getCourseById = async (id) => {
  const course = await prisma.course.findUnique({
    where: { id: Number(id) },
    include: {
      modules: {
        include: { lessons: true },
      },
      batches: true,
    },
  });
  if (!course) {
    throw { statusCode: 404, message: 'Course not found' };
  }
  return course;
};

const updateCourse = async (id, data) => {
  // Whitelist allowed fields to prevent "Unknown argument" errors (like 'code', 'type')
  const {
    title, slug, description, price, mrp, isPaid,
    image, thumbnail, active, validityDays,
    duration, lectures, projects, certificate, access, currency, points
  } = data;

  const updateData = {
    title, slug, description, image, thumbnail,
    price, mrp, isPaid, active, validityDays,
    duration, lectures, projects, certificate, access, currency, points
  };

  // Remove undefined keys so we don't overwrite with null unless intended
  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );

  return await prisma.course.update({
    where: { id },
    data: updateData,
  });
};

const deleteCourse = async (id) => {
  // Perform cascading delete in a transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Unlink Enquiries linked to this course
    await tx.enquiry.updateMany({
      where: { courseId: id },
      data: { courseId: null }
    });

    // 2. Unlink Users linked to this course (course_id field)
    await tx.user.updateMany({
      where: { courseId: id },
      data: { courseId: null, courseName: null }
    });

    // 3. Handle Batches and Enrollments
    const batches = await tx.batch.findMany({
      where: { courseId: id },
      select: { id: true }
    });
    const batchIds = batches.map(b => b.id);

    if (batchIds.length > 0) {
      // Find all enrollments in these batches
      const enrollments = await tx.enrollment.findMany({
        where: { batchId: { in: batchIds } },
        select: { id: true }
      });
      const enrollmentIds = enrollments.map(e => e.id);

      if (enrollmentIds.length > 0) {
        // Delete dependent data for Enrollments
        // Delete EnrollmentHistory
        await tx.enrollmentHistory.deleteMany({
          where: { enrollmentId: { in: enrollmentIds } }
        });

        // Find payments to delete (and their invoices)
        const payments = await tx.payment.findMany({
          where: { enrollmentId: { in: enrollmentIds } },
          select: { id: true }
        });
        const paymentIds = payments.map(p => p.id);

        if (paymentIds.length > 0) {
          // Delete Invoices linked to payments
          await tx.invoice.deleteMany({
            where: { paymentId: { in: paymentIds } }
          });

          // Delete Payments
          await tx.payment.deleteMany({
            where: { id: { in: paymentIds } }
          });
        }

        // Delete Enrollments
        await tx.enrollment.deleteMany({
          where: { id: { in: enrollmentIds } }
        });
      }

      // Delete Attendance for these batches
      await tx.attendance.deleteMany({
        where: { batchId: { in: batchIds } }
      });

      // Delete BatchVideoMaps for these batches
      await tx.batchVideoMap.deleteMany({
        where: { batchId: { in: batchIds } }
      });

      // Delete Batches
      await tx.batch.deleteMany({
        where: { id: { in: batchIds } }
      });
    }

    // 4. Handle Modules and Lessons
    const modules = await tx.module.findMany({
      where: { courseId: id },
      select: { id: true }
    });
    const moduleIds = modules.map(m => m.id);

    if (moduleIds.length > 0) {
      const lessons = await tx.lesson.findMany({
        where: { moduleId: { in: moduleIds } },
        select: { id: true }
      });
      const lessonIds = lessons.map(l => l.id);

      if (lessonIds.length > 0) {
        // Delete WatchLogs
        await tx.watchLog.deleteMany({
          where: { lessonId: { in: lessonIds } }
        });

        // Delete BatchVideoMaps (by lesson) - check if any remain
        await tx.batchVideoMap.deleteMany({
          where: { lessonId: { in: lessonIds } }
        });

        // Delete Lessons
        await tx.lesson.deleteMany({
          where: { id: { in: lessonIds } }
        });
      }

      // Delete Modules
      await tx.module.deleteMany({
        where: { id: { in: moduleIds } }
      });
    }

    // 5. Finally, delete the Course
    return await tx.course.delete({
      where: { id }
    });
  });
};

module.exports = {
  createCourse,
  getCourses,
  getCourseBySlug,
  getCourseById,
  updateCourse,
  deleteCourse,
};

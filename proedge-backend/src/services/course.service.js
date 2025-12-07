const prisma = require('../config/prisma');

const createCourse = async (data) => {
  const {
    title, slug, description, price, mrp, isPaid,
    image, thumbnail, active, validityDays,
    duration, lectures, projects, certificate, access
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

const updateCourse = async (id, data) => {
  return await prisma.course.update({
    where: { id },
    data,
  });
};

const deleteCourse = async (id) => {
  return await prisma.course.delete({ where: { id } });
};

module.exports = {
  createCourse,
  getCourses,
  getCourseBySlug,
  updateCourse,
  deleteCourse,
};

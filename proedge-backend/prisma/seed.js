const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@proedge.com' },
    update: {},
    create: {
      email: 'admin@proedge.com',
      passwordHash: adminPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('Created admin:', admin.email);

  // Create demo students
  const students = [];
  for (let i = 1; i <= 5; i++) {
    const studentPassword = await bcrypt.hash('student123', 10);
    const student = await prisma.user.upsert({
      where: { email: `student${i}@proedge.com` },
      update: {},
      create: {
        email: `student${i}@proedge.com`,
        passwordHash: studentPassword,
        fullName: `Student ${i}`,
        studentId: `STU${String(i).padStart(3, '0')}`,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });
    students.push(student);
  }
  console.log('Created 5 demo students');

  // Create courses
  const courses = [];
  for (let i = 1; i <= 3; i++) {
    const course = await prisma.course.upsert({
      where: { slug: `course-${i}` },
      update: {},
      create: {
        title: `Demo Course ${i}`,
        slug: `course-${i}`,
        description: `This is a demo course ${i} for Proedge LMS`,
        price: 999 + i * 100,
        isPaid: true,
        currency: 'INR',
      },
    });
    courses.push(course);
  }
  console.log('Created 3 demo courses');

  // Create modules and lessons for first course
  const module1 = await prisma.module.create({
    data: {
      title: 'Introduction',
      order: 1,
      courseId: courses[0].id,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        title: 'Welcome Video',
        order: 1,
        moduleId: module1.id,
        videoUrl: 's3://demo-bucket/welcome.mp4',
        durationSec: 300,
      },
      {
        title: 'Getting Started',
        order: 2,
        moduleId: module1.id,
        videoUrl: 's3://demo-bucket/getting-started.mp4',
        durationSec: 600,
      },
    ],
  });
  console.log('Created modules and lessons');

  // Create batches
  const batches = [];
  for (let i = 1; i <= 2; i++) {
    const batch = await prisma.batch.create({
      data: {
        name: `Batch ${i}`,
        tutorName: `Tutor ${i}`,
        courseId: courses[i - 1].id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      },
    });
    batches.push(batch);
  }
  console.log('Created 2 demo batches');

  // Create enrollments
  await prisma.enrollment.create({
    data: {
      userId: students[0].id,
      courseId: courses[0].id,
      batchId: batches[0].id,
      status: 'ACTIVE',
    },
  });
  console.log('Created demo enrollment');

  console.log('Seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

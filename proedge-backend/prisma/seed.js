const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Starting enhanced seed...');

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
  console.log('✓ Created admin:', admin.email);

  // Create pre-approved students
  const preApprovedStudents = [];
  for (let i = 1; i <= 10; i++) {
    const studentId = `STU${String(i).padStart(4, '0')}`;
    const preApproved = await prisma.preApprovedStudent.upsert({
      where: { studentId },
      update: {},
      create: {
        studentId,
        fullName: `Student ${i}`,
        email: `student${i}@proedge.com`,
      },
    });
    preApprovedStudents.push(preApproved);
  }
  console.log('✓ Created 10 pre-approved students');

  // Create demo students
  const students = [];
  for (let i = 1; i <= 10; i++) {
    const studentPassword = await bcrypt.hash('student123', 10);
    const student = await prisma.user.upsert({
      where: { email: `student${i}@proedge.com` },
      update: {},
      create: {
        email: `student${i}@proedge.com`,
        passwordHash: studentPassword,
        fullName: `Student ${i}`,
        studentId: `STU${String(i).padStart(4, '0')}`,
        role: 'STUDENT',
        status: 'ACTIVE',
        studentIdVerified: true,
        isPreApproved: true,
      },
    });
    students.push(student);
  }
  console.log('✓ Created 10 demo students');

  // Create tutor
  const tutorPassword = await bcrypt.hash('tutor123', 10);
  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@proedge.com' },
    update: {},
    create: {
      email: 'tutor@proedge.com',
      passwordHash: tutorPassword,
      fullName: 'Demo Tutor',
      role: 'TUTOR',
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created tutor:', tutor.email);

  // Create courses
  const courses = [];
  for (let i = 1; i <= 3; i++) {
    const course = await prisma.course.upsert({
      where: { slug: `course-${i}` },
      update: {},
      create: {
        title: `Demo Course ${i}`,
        slug: `course-${i}`,
        description: `This is demo course ${i} for Proedge LMS`,
        price: 999 + i * 100,
        isPaid: true,
        currency: 'INR',
      },
    });
    courses.push(course);
  }
  console.log('✓ Created 3 demo courses');

  // Create modules and lessons
  for (const course of courses) {
    const module1 = await prisma.module.create({
      data: {
        title: 'Introduction',
        order: 1,
        courseId: course.id,
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
  }
  console.log('✓ Created modules and lessons');

  // Create batches
  const batches = [];
  for (let i = 1; i <= 2; i++) {
    const batch = await prisma.batch.create({
      data: {
        name: `Batch ${i}`,
        tutorName: tutor.fullName,
        courseId: courses[i - 1].id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
    batches.push(batch);
  }
  console.log('✓ Created 2 demo batches');

  // Create enrollments
  for (let i = 0; i < 5; i++) {
    await prisma.enrollment.create({
      data: {
        userId: students[i].id,
        courseId: courses[0].id,
        batchId: batches[0].id,
        status: 'ACTIVE',
      },
    });
  }
  console.log('✓ Created 5 demo enrollments');

  // Create sample watch logs
  const lessons = await prisma.lesson.findMany({ take: 2 });
  for (let i = 0; i < 3; i++) {
    await prisma.watchLog.create({
      data: {
        userId: students[i].id,
        lessonId: lessons[0].id,
        watchedSec: 180,
        lastPosition: 180,
        percentage: 60,
        completed: false,
        sessionCount: 1,
      },
    });
  }
  console.log('✓ Created sample watch logs');

  // Create sample attendance
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    await prisma.attendance.create({
      data: {
        userId: students[i].id,
        batchId: batches[0].id,
        date: today,
        status: 'PRESENT',
        autoMarked: true,
        watchPercent: 75,
      },
    });
  }
  console.log('✓ Created sample attendance');

  // Create sample notifications
  for (let i = 0; i < 3; i++) {
    await prisma.notification.create({
      data: {
        userId: students[i].id,
        type: 'IN_APP',
        title: 'Welcome to Proedge!',
        message: 'Start your learning journey today',
        read: false,
      },
    });
  }
  console.log('✓ Created sample notifications');

  console.log('\n✅ Seed completed successfully!');
  console.log('\nDemo Credentials:');
  console.log('Admin: admin@proedge.com / admin123');
  console.log('Tutor: tutor@proedge.com / tutor123');
  console.log('Students: student1@proedge.com to student10@proedge.com / student123');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

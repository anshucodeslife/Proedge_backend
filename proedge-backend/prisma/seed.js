const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Starting scaled seed (10x)...');

  // 1. Clean up existing data (except Admin)
  // Delete child tables first to avoid FK constraints
  await prisma.invoice.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.enrollmentHistory.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.watchLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.batchVideoMap.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.preApprovedStudent.deleteMany({});
  // Delete all users except Admin and SuperAdmin
  await prisma.user.deleteMany({
    where: {
      NOT: {
        email: {
          in: ['admin@proedge.com', 'superadmin@proedge.com']
        }
      }
    }
  });
  console.log('✓ Cleaned up previous data');

  // 2. Create/Update Admin Users
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
  console.log('✓ Admin ready:', admin.email);

  const superAdminPassword = await bcrypt.hash('anshu123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@proedge.com' },
    update: {},
    create: {
      email: 'superadmin@proedge.com',
      passwordHash: superAdminPassword,
      fullName: 'Super Admin',
      role: 'SUPERADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✓ Super Admin ready:', superAdmin.email);

  // 3. Create 10 Pre-approved Students
  const preApprovedStudents = [];
  for (let i = 1; i <= 10; i++) {
    const studentId = `STU${String(i).padStart(4, '0')}`;
    const preApproved = await prisma.preApprovedStudent.create({
      data: {
        studentId,
        fullName: `Pre-Approved Student ${i}`,
        email: `pre.${i}@proedge.com`,
        phone: `98765432${String(i).padStart(2, '0')}`,
      },
    });
    preApprovedStudents.push(preApproved);
  }
  console.log('✓ Created 10 Pre-Approved Students');

  // 4. Create 10 Students (Users)
  const students = [];
  const studentPassword = await bcrypt.hash('student123', 10);
  for (let i = 1; i <= 10; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student${i}@proedge.com`,
        passwordHash: studentPassword,
        fullName: `Student ${i}`,
        studentId: `STU${String(i).padStart(4, '0')}`,
        role: 'STUDENT',
        status: 'ACTIVE',
        studentIdVerified: true,
        isPreApproved: true,
        contact: `98765430${String(i).padStart(2, '0')}`,
        dob: '2000-01-01',
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
      },
    });
    students.push(student);
  }
  console.log('✓ Created 10 Students');

  // 5. Create 1 Tutor
  const tutorPassword = await bcrypt.hash('tutor123', 10);
  const tutor = await prisma.user.create({
    data: {
      email: 'tutor@proedge.com',
      passwordHash: tutorPassword,
      fullName: 'Demo Tutor 1',
      role: 'TUTOR',
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created Tutor');

  // 6. Create 10 Courses
  const courses = [];
  for (let i = 1; i <= 10; i++) {
    const course = await prisma.course.create({
      data: {
        title: `Pro Course ${i}`,
        slug: `course-${i}`,
        description: `Comprehensive guide for Course ${i}. Learn everything about it.`,
        price: 999 + (i * 100),
        mrp: 1999 + (i * 100),
        isPaid: true,
        currency: 'INR',
        active: true,
        image: 'https://backend.proedgelearning.in/assets/course-thumbnail.jpg',
        thumbnail: 'https://backend.proedgelearning.in/assets/course-thumbnail.jpg',
        duration: '10 Weeks',
        lectures: '20 Lessons',
        projects: '2 Projects',
        certificate: 'Yes',
        access: 'Lifetime',
        validityDays: 365,
      },
    });
    courses.push(course);
  }
  console.log('✓ Created 10 Courses');

  // 7. Create Modules & Lessons (1 Module per course, 2 Lessons per module = 10 Modules, 20 Lessons)
  const allModules = [];
  const allLessons = [];
  for (const course of courses) {
    const module = await prisma.module.create({
      data: {
        title: `Module 1: Basics of ${course.title}`,
        order: 1,
        courseId: course.id,
      },
    });
    allModules.push(module);

    // Create 2 lessons for this module
    for (let j = 1; j <= 2; j++) {
      const lesson = await prisma.lesson.create({
        data: {
          title: `Lesson ${j}: Topic ${j}`,
          order: j,
          moduleId: module.id,
          videoUrl: j === 1 ? 's3://demo-bucket/intro.mp4' : 's3://demo-bucket/deep-dive.mp4',
          durationSec: 300 * j,
        },
      });
      allLessons.push(lesson);
    }
  }
  console.log('✓ Created 10 Modules and 20 Lessons');

  // 8. Create 10 Batches (1 per course)
  const batches = [];
  for (let i = 0; i < 10; i++) {
    const batch = await prisma.batch.create({
      data: {
        name: `Batch A-${i + 1}`,
        tutorName: tutor.fullName,
        courseId: courses[i].id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
    batches.push(batch);
  }
  console.log('✓ Created 10 Batches');

  // 9. Create 10 Enrollments (Assign each student to one course/batch)
  const enrollments = [];
  for (let i = 0; i < 10; i++) {
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: students[i].id,
        courseId: courses[i].id,
        batchId: batches[i].id,
        status: 'ACTIVE',
      },
    });
    enrollments.push(enrollment);
  }
  console.log('✓ Created 10 Enrollments');

  // 10. Create 10 Payments & Invoices (1 per enrollment)
  for (let i = 0; i < 10; i++) {
    const payment = await prisma.payment.create({
      data: {
        orderId: `order_${Math.random().toString(36).substring(7)}`,
        paymentId: `pay_${Math.random().toString(36).substring(7)}`,
        amount: Number(courses[i].price),
        status: 'SUCCESS',
        enrollmentId: enrollments[i].id,
        provider: 'razorpay',
        currency: 'INR',
      },
    });

    await prisma.invoice.create({
      data: {
        paymentId: payment.id,
        invoiceNo: `INV-${202500 + i}`,
        amount: Number(courses[i].price),
        total: Number(courses[i].price),
        pdfUrl: 'https://backend.proedgelearning.in/invoices/demo.pdf',
      },
    });
  }
  console.log('✓ Created 10 Payments & Invoices');

  // 11. Create 10 Attendance Records (1 per student)
  for (let i = 0; i < 10; i++) {
    await prisma.attendance.create({
      data: {
        userId: students[i].id,
        batchId: batches[i].id, // They are enrolled in batches[i]
        date: new Date(),
        status: i % 3 === 0 ? 'ABSENT' : 'PRESENT',
        autoMarked: true,
        watchPercent: 80,
      },
    });
  }
  console.log('✓ Created 10 Attendance Records');

  // 12. Create 10 Watch Logs (1 per student, watching lesson 1)
  for (let i = 0; i < 10; i++) {
    // Find the first lesson of the course they are enrolled in
    // courses[i] -> allModules[i] (since we made 1 module per course) -> we need a lesson from that module
    // But allLessons is flat.
    // Easier: Just pick a lesson. We know allLessons has 20 items.
    // Lesson for course i would be something connected to allModules[i].
    const lessonId = allLessons[i * 2].id; // 1st lesson of their course's module

    await prisma.watchLog.create({
      data: {
        userId: students[i].id,
        lessonId: lessonId,
        watchedSec: 120,
        lastPosition: 120,
        percentage: 40,
        completed: false,
        sessionCount: 1,
      },
    });
  }
  console.log('✓ Created 10 Watch Logs');

  // 13. Create 10 Notifications
  for (let i = 0; i < 10; i++) {
    await prisma.notification.create({
      data: {
        userId: students[i].id,
        type: 'IN_APP',
        title: 'Welcome to Proedge!',
        message: 'Your course has started.',
        read: i % 2 === 0,
      },
    });
  }
  console.log('✓ Created 10 Notifications');

  // 14. Create 10 Coupons
  for (let i = 1; i <= 10; i++) {
    await prisma.coupon.create({
      data: {
        code: `SAVE${i}0`,
        discountType: i % 2 === 0 ? 'FIXED' : 'PERCENT',
        discountValue: i % 2 === 0 ? 500 : 10,
        maxUses: 100,
        usageCount: 0,
      },
    });
  }
  console.log('✓ Created 10 Coupons');

  // 15. Create BatchVideoMap (2 per batch) -> 20 records
  for (const batch of batches) {
    const batchLessons = allLessons.filter(l => allModules.find(m => m.id === l.moduleId).courseId === batch.courseId);
    for (const lesson of batchLessons) {
      await prisma.batchVideoMap.create({
        data: {
          batchId: batch.id,
          lessonId: lesson.id,
          videoUrl: lesson.videoUrl, // Mapped same URL
        },
      });
    }
  }
  console.log('✓ Created Batch Video Maps');

  // 16. Enrollment History (1 per enrollment)
  for (const enrollment of enrollments) {
    await prisma.enrollmentHistory.create({
      data: {
        enrollmentId: enrollment.id,
        action: 'ENROLLED',
        note: 'Initial Enrollment',
        actor: 'SYSTEM'
      }
    });
  }
  console.log('✓ Created 10 Enrollment History Records');

  console.log('\n✅ Scaled Seed (10x) completed successfully!');

  console.log('\n✅ Seed completed successfully!');
  console.log('\nDemo Credentials:');
  console.log('Admin: admin@proedge.com / admin123');
  console.log('Super Admin: superadmin@proedge.com / anshu123');
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

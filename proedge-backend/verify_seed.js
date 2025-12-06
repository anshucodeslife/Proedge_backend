const prisma = require('./src/config/prisma');

async function verify() {
    console.log('Verifying database counts...');

    const counts = {
        User: await prisma.user.count(),
        PreApprovedStudent: await prisma.preApprovedStudent.count(),
        Course: await prisma.course.count(),
        Module: await prisma.module.count(),
        Lesson: await prisma.lesson.count(),
        Batch: await prisma.batch.count(),
        Enrollment: await prisma.enrollment.count(),
        Attendance: await prisma.attendance.count(),
        WatchLog: await prisma.watchLog.count(),
        Payment: await prisma.payment.count(),
        Invoice: await prisma.invoice.count(),
        Coupon: await prisma.coupon.count(),
        EnrollmentHistory: await prisma.enrollmentHistory.count(),
        BatchVideoMap: await prisma.batchVideoMap.count(),
        Notification: await prisma.notification.count(),
    };

    console.table(counts);
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

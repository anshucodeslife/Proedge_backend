const prisma = require('./src/config/prisma');

async function verify() {
    const counts = {
        users: await prisma.user.count(),
        courses: await prisma.course.count(),
        batches: await prisma.batch.count(),
        modules: await prisma.module.count(),
        lessons: await prisma.lesson.count(),
        enrollments: await prisma.enrollment.count(),
        payments: await prisma.payment.count(),
        invoices: await prisma.invoice.count(),
        coupons: await prisma.coupon.count(),
        preApproved: await prisma.preApprovedStudent.count(),
        notifications: await prisma.notification.count(),
        watchLogs: await prisma.watchLog.count(),
        attendance: await prisma.attendance.count(),
        batchVideoMaps: await prisma.batchVideoMap.count(),
    };

    console.log('Row Counts:', counts);
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

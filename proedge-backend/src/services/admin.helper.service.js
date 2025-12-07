const prisma = require('../config/prisma');

/**
 * Search students by student_id, name, or email
 * @param {string} query - Search query
 * @param {number} limit - Max results
 */
async function searchStudents(query, limit = 20) {
    const students = await prisma.user.findMany({
        where: {
            role: 'STUDENT',
            OR: [
                { studentId: { contains: query, mode: 'insensitive' } },
                { fullName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
            ],
        },
        select: {
            id: true,
            studentId: true,
            fullName: true,
            email: true,
            status: true,
        },
        take: limit,
    });

    return students;
}

/**
 * Assign course to multiple students
 * @param {number} courseId - Course ID
 * @param {Array<number>} userIds - Array of user IDs
 * @param {number} batchId - Optional batch ID
 */
async function assignCourseToStudents(courseId, userIds, batchId = null) {
    const results = {
        success: [],
        failed: [],
        alreadyEnrolled: [],
    };

    for (const userId of userIds) {
        try {
            // Check if already enrolled
            const existing = await prisma.enrollment.findFirst({
                where: {
                    userId,
                    courseId,
                    status: 'ACTIVE',
                },
            });

            if (existing) {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { studentId: true, fullName: true },
                });
                results.alreadyEnrolled.push({
                    userId,
                    studentId: user?.studentId,
                    fullName: user?.fullName,
                });
                continue;
            }

            // Create enrollment
            const enrollment = await prisma.enrollment.create({
                data: {
                    userId,
                    courseId,
                    batchId,
                    status: 'ACTIVE',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            studentId: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
            });

            results.success.push({
                userId,
                studentId: enrollment.user.studentId,
                fullName: enrollment.user.fullName,
                enrollmentId: enrollment.id,
            });
        } catch (err) {
            results.failed.push({
                userId,
                reason: err.message,
            });
        }
    }

    return results;
}

module.exports = {
    searchStudents,
    assignCourseToStudents,
};

const prisma = require('../config/prisma');

/**
 * Bulk create attendance records from Excel upload
 * @param {string} date - Attendance date (YYYY-MM-DD)
 * @param {Array} attendanceData - [{student_id, attendance}]
 */
async function bulkCreateAttendance(date, attendanceData) {
    const attendanceDate = new Date(date);
    const results = {
        success: [],
        failed: [],
    };

    for (const record of attendanceData) {
        try {
            const { student_id, attendance } = record;

            // Find user by studentId
            const user = await prisma.user.findUnique({
                where: { studentId: String(student_id) },
            });

            if (!user) {
                results.failed.push({
                    student_id,
                    reason: 'Student not found',
                });
                continue;
            }

            // Map attendance string to enum
            let status = 'PRESENT';
            const attendanceLower = String(attendance).toLowerCase().trim();
            if (attendanceLower === 'absent' || attendanceLower === 'a') {
                status = 'ABSENT';
            } else if (attendanceLower === 'leave' || attendanceLower === 'l') {
                status = 'ON_LEAVE';
            }

            // Upsert attendance (update if exists, create if not)
            await prisma.attendance.upsert({
                where: {
                    userId_date: {
                        userId: user.id,
                        date: attendanceDate,
                    },
                },
                update: {
                    status,
                },
                create: {
                    userId: user.id,
                    date: attendanceDate,
                    status,
                    batchId: null, // Can be enhanced to link to batch
                },
            });

            results.success.push({
                student_id,
                status,
            });
        } catch (err) {
            results.failed.push({
                student_id: record.student_id,
                reason: err.message,
            });
        }
    }

    return results;
}

/**
 * Get attendance records with filters
 */
async function getAttendance(filters) {
    const where = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) where.date.gte = new Date(filters.startDate);
        if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const attendance = await prisma.attendance.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    studentId: true,
                    fullName: true,
                    email: true,
                },
            },
            batch: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            date: 'desc',
        },
    });

    return attendance;
}

/**
 * Update attendance record
 */
async function updateAttendance(id, data) {
    return await prisma.attendance.update({
        where: { id },
        data: {
            status: data.status,
            note: data.note,
        },
    });
}

/**
 * Delete attendance record
 */
async function deleteAttendance(id) {
    return await prisma.attendance.delete({
        where: { id },
    });
}

module.exports = {
    bulkCreateAttendance,
    getAttendance,
    updateAttendance,
    deleteAttendance,
};

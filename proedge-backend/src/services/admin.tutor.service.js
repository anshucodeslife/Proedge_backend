const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

/**
 * Create a new tutor
 */
async function createTutor(data) {
    const { fullName, email, contact, password, subjects, bio } = data;

    // Check if email exists
    const existing = await prisma.user.findUnique({
        where: { email },
    });

    if (existing) {
        throw new Error('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || contact || 'tutor123', 10);

    const tutor = await prisma.user.create({
        data: {
            fullName,
            email,
            contact,
            passwordHash: hashedPassword,
            role: 'TUTOR',
            status: 'ACTIVE',
            subjects, // Using existing string field for now, or could be JSON if schema supports
            // bio is not in User schema based on previous view, so avoiding for now unless expanded
            createdAt: new Date(),
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            contact: true,
            subjects: true,
            status: true,
            createdAt: true,
        }
    });

    return tutor;
}

/**
 * Get all tutors
 */
async function getAllTutors(search = '') {
    const where = {
        role: 'TUTOR',
        ...(search && {
            OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ],
        }),
    };

    const tutors = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            fullName: true,
            email: true,
            contact: true,
            subjects: true,
            status: true,
            status: true,
            createdAt: true,
        }
    });

    // Correction: User model in schema.prisma showed "enrollments Enrollment[]", "attendance Attendance[]"
    // It did NOT show a relation "batches" for Tutors. 
    // Batch model has "tutorName String?".
    // So we can't easily count batches via relation. We'll skip the count for now or fetch separately.

    return tutors;
}

/**
 * Update tutor
 */
async function updateTutor(id, data) {
    const { fullName, email, contact, subjects, status } = data;

    const tutor = await prisma.user.update({
        where: { id },
        data: {
            ...(fullName && { fullName }),
            ...(email && { email }),
            ...(contact && { contact }),
            ...(subjects && { subjects }),
            ...(status && { status }),
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            contact: true,
            subjects: true,
            status: true,
        }
    });

    return tutor;
}

/**
 * Delete tutor
 */
async function deleteTutor(id) {
    // Soft delete by setting status INACTIVE or actual delete if required
    // Let's do soft delete first
    await prisma.user.update({
        where: { id },
        data: { status: 'INACTIVE' },
    });

    return { message: 'Tutor deactivated' };
}

module.exports = {
    createTutor,
    getAllTutors,
    updateTutor,
    deleteTutor
};

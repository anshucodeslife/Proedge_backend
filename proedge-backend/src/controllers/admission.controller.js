const prisma = require('../config/prisma');

// Save student record (Admission Form)
const saveBatch1Admission = async (req, res, next) => {
    try {
        const data = req.body || {};
        const contact = data.contact || data.contactNumber || data.contactNo || null;

        if (!data.fullName || !contact || !data.email) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        let referralId = null;
        let referralCode = null;
        let referralAmount = null;
        let totalFees = data.totalFees ? parseFloat(String(data.totalFees).replace(/[^0-9.-]/g, "")) : null;
        const originalFees = data.originalFees ? parseFloat(String(data.originalFees).replace(/[^0-9.-]/g, "")) : null;

        if (data.referralCode) {
            const referral = await prisma.referral.findUnique({
                where: { code: data.referralCode.toUpperCase() }
            });

            if (referral && !referral.deletedAt && referral.active) {
                referralId = referral.id;
                referralCode = referral.code;
                if (originalFees) {
                    const discountPercentage = Number(referral.discount);
                    referralAmount = Math.round(originalFees * (discountPercentage / 100));
                    totalFees = originalFees - referralAmount;
                }
            } else {
                return res.status(400).json({ success: false, error: "Invalid or inactive referral code" });
            }
        }

        const admissionData = {
            fullName: data.fullName,
            email: data.email,
            contact: contact,
            dob: data.dob || null,
            gender: data.gender || null,
            address: data.address || null,
            parentName: data.parentName || null,
            parentContact: data.parentContact || null,
            currentSchool: data.currentSchool || null,
            classYear: data.classYear || null,
            subjects: data.subjects || null,
            educationLevel: data.educationLevel || null,
            school: data.school || null,
            board: data.board || null,

            courseName: data.courseName || null,
            batchTiming: data.batchTiming || null,
            duration: data.duration || null,
            totalFees: totalFees,
            originalFees: originalFees,
            paymentMode: data.paymentMode || null,
            paymentOption: data.paymentOption || null,

            installment1Amount: data.installment1Amount ? parseFloat(data.installment1Amount) : null,
            installment1Date: data.installment1Date || null,
            installment2Amount: data.installment2Amount ? parseFloat(data.installment2Amount) : null,
            installment2Date: data.installment2Date || null,
            installment3Amount: data.installment3Amount ? parseFloat(data.installment3Amount) : null,
            installment3Date: data.installment3Date || null,

            referralId: referralId,
            referralCode: referralCode,
            referralAmount: referralAmount,

            studentSignature: data.studentSignature || null,
            parentSignature: data.parentSignature || null,
            submissionDate: data.date || new Date().toISOString().split("T")[0],

            emergencyName: data.emergencyName || null,
            emergencyRelation: data.emergencyRelation || null,
            emergencyPhone: data.emergencyPhone || null,

            referenceNo: data.referenceNo || null,
        };

        const newAdmission = await prisma.batch1admission.create({
            data: admissionData,
        });

        return res.json({ success: true, message: "Admission registered successfully", id: newAdmission.id });
    } catch (err) {
        next(err);
    }
};

const getBatch1Admissions = async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
        const offset = parseInt(req.query.offset) || 0;

        const admissions = await prisma.batch1admission.findMany({
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
            where: { deletedAt: null }
        });

        const count = await prisma.batch1admission.count({ where: { deletedAt: null } });

        return res.json({ success: true, data: admissions, count });
    } catch (err) {
        next(err);
    }
};

const getBatch1AdmissionById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!id) return res.status(400).json({ success: false, error: "Invalid id" });

        const admission = await prisma.batch1admission.findUnique({
            where: { id }
        });

        if (!admission) return res.status(404).json({ success: false, error: "Not found" });
        return res.json({ success: true, data: admission });
    } catch (err) {
        next(err);
    }
};

const updateBatch1Admission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { id: _id, createdAt, updatedAt, ...data } = req.body;

        const updateData = {
            ...data,
            totalFees: data.totalFees ? parseFloat(data.totalFees) : undefined,
            originalFees: data.originalFees ? parseFloat(data.originalFees) : undefined,
            installment1Amount: data.installment1Amount ? parseFloat(data.installment1Amount) : null,
            installment2Amount: data.installment2Amount ? parseFloat(data.installment2Amount) : null,
            installment2Date: data.installment2Date || null,
            installment3Amount: data.installment3Amount ? parseFloat(data.installment3Amount) : null,
            installment3Date: data.installment3Date || null,
            referenceNo: data.referenceNo !== undefined ? data.referenceNo : undefined,
        };

        const updatedAdmission = await prisma.batch1admission.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        return res.json({ success: true, message: "Admission updated successfully", data: updatedAdmission });
    } catch (err) {
        next(err);
    }
};

const deleteBatch1Admission = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.batch1admission.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() }
        });
        return res.json({ success: true, message: "Admission deleted successfully" });
    } catch (err) {
        next(err);
    }
};

// Enroll Student from Batch1Admission -> Creates User
const enrollStudentFromAdmission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const additionalData = req.body || {};

        const admission = await prisma.batch1admission.findUnique({ where: { id: parseInt(id) } });
        if (!admission) return res.status(404).json({ success: false, error: "Admission not found" });

        // Exclude metadata needed for User
        const { id: _, createdAt, updatedAt, ...baseStudentData } = admission;

        // Generate Student ID (Logic adapted to User table if needed, standardizing on studentId field)
        const lastUser = await prisma.user.findFirst({
            where: { role: 'STUDENT', studentId: { not: null } },
            orderBy: { id: 'desc' },
            select: { studentId: true }
        });

        let nextId = 'S001';
        if (lastUser && lastUser.studentId) {
            const num = parseInt(lastUser.studentId.replace('S', ''));
            if (!isNaN(num)) {
                nextId = `S${String(num + 1).padStart(3, '0')}`;
            }
        }

        // Default password for auto-enrollment
        const defaultPasswordHash = 'HASH_PLACEHOLDER'; // Ideally verify signature or handle properly later

        const userData = {
            ...baseStudentData,
            ...additionalData,
            studentId: nextId,
            role: 'STUDENT',
            passwordHash: defaultPasswordHash, // Needs proper hashing if implementing fully
            fullName: admission.fullName, // Explicit mapping just in case
            email: admission.email,
        };

        // Clean up fields that might not match exact User schema if any leftovers
        // Using simple spread for now as schema merger aligned most fields.

        const newUser = await prisma.user.create({
            data: userData
        });

        return res.json({ success: true, message: "Student enrolled successfully", data: newUser });
    } catch (err) {
        next(err);
    }
};

// Enroll from Enquiry
const enrollStudentFromEnquiry = async (req, res, next) => {
    try {
        const { id } = req.params;
        const additionalData = req.body || {}; // Payment info etc

        const enquiry = await prisma.enquiry.findUnique({ where: { id: parseInt(id) } });
        if (!enquiry) return res.status(404).json({ success: false, error: "Enquiry not found" });

        const lastUser = await prisma.user.findFirst({
            where: { role: 'STUDENT', studentId: { not: null } },
            orderBy: { id: 'desc' },
            select: { studentId: true }
        });

        let nextId = 'S001';
        if (lastUser && lastUser.studentId) {
            const num = parseInt(lastUser.studentId.replace('S', ''));
            if (!isNaN(num)) {
                nextId = `S${String(num + 1).padStart(3, '0')}`;
            }
        }

        const userData = {
            studentId: nextId,
            fullName: enquiry.fullName,
            email: enquiry.email,
            contact: enquiry.contact,
            dob: enquiry.dob,
            gender: enquiry.gender,
            educationLevel: enquiry.educationLevel,
            courseName: enquiry.preferredCourses,
            batchTiming: enquiry.batchTiming,
            emergencyName: enquiry.emergencyName,
            emergencyRelation: enquiry.emergencyRelation,
            emergencyPhone: enquiry.emergencyPhone,

            role: 'STUDENT',
            passwordHash: 'HASH_PLACEHOLDER',

            ...additionalData,
        };

        const newUser = await prisma.user.create({
            data: userData
        });

        await prisma.enquiry.update({
            where: { id: parseInt(id) },
            data: { status: 'Converted' }
        });

        return res.json({ success: true, message: "Student enrolled successfully", data: newUser });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    saveBatch1Admission,
    getBatch1Admissions,
    getBatch1AdmissionById,
    updateBatch1Admission,
    deleteBatch1Admission,
    enrollStudentFromAdmission,
    enrollStudentFromEnquiry
};

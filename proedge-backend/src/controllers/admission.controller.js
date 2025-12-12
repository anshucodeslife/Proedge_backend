const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const enrollmentService = require('../services/enrollment.service');

// Save student record (Admission Form) -> Now creates User + PENDING Enrollment
const saveBatch1Admission = async (req, res, next) => {
    try {
        const data = req.body || {};

        // Validation
        if (!data.fullName || !data.email) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        // Map frontend "Form Data" to "initiateEnrollment" structure
        // enrollment.service expects: { name, fullName, email, contact, courseId, enrollmentDetails, amount? }

        // Find Course ID via Name if needed, or expect courseId. 
        // Form usually sends courseName.
        let courseId = data.courseId;
        if (!courseId && data.courseName) {
            const course = await prisma.course.findFirst({
                where: { title: { equals: data.courseName, mode: 'insensitive' } }
            });
            courseId = course?.id;
        }

        if (!courseId) {
            // Fallback or Error? 
            // If legacy form doesn't send ID, we might have an issue.
            // But let's assume one default course or error.
            return res.status(400).json({ success: false, error: "Invalid Course selection" });
        }

        const enrollmentPayload = {
            fullName: data.fullName,
            email: data.email,
            contact: data.contact || data.contactNumber,
            courseId: courseId,
            amount: data.paymentMode === 'Online' ? data.totalFees : 0, // IF online/UPI, we pass amount to trigger Gateway logic? 
            // Wait, previous service logic checks Payment Mode explicitly. 
            // So we can pass amount. But service calculates default if 0.

            // Pass all profile fields in 'enrollmentDetails'
            enrollmentDetails: {
                dob: data.dob,
                gender: data.gender,
                address: data.address,
                parentName: data.parentName,
                parentContact: data.parentContact,
                academic: {
                    school: data.currentSchool,
                    class: data.classYear,
                    subjects: data.subjects,
                    board: data.board,
                    educationLevel: data.educationLevel
                },
                batchTiming: data.batchTiming,

                totalFees: data.totalFees,
                originalFees: data.originalFees,
                paymentOption: data.paymentOption,

                referralCode: data.referralCode,
                // Services will fetch referral discount if valid? 
                // enrollment.service handles profileData mapping but maybe not Referral validation/calc.
                // Assuming service handles basic fields.

                paymentPlan: {
                    inst1: data.installment1Amount,
                    inst2: data.installment2Amount,
                    dueDate2: data.installment2Date,
                    inst3: data.installment3Amount,
                    dueDate3: data.installment3Date
                }
            },

            // Pass raw payment mode for service to detect Offline
            paymentMode: data.paymentMode
        };

        const result = await enrollmentService.initiateEnrollment(enrollmentPayload);

        return res.json({
            success: true,
            message: "Admission registered successfully",
            id: result.enrollmentId,
            invoiceNo: result.invoiceNo // Return invoice if generated
        });
    } catch (err) {
        // Handle specific service errors
        if (err.statusCode) {
            return res.status(err.statusCode).json({ success: false, error: err.message });
        }
        next(err);
    }
};

const getBatch1Admissions = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const page = Math.floor(offset / limit) + 1;

        // Use enrollmentService to fetch enrollments as "Admissions"
        // This keeps consistency with the Admin Panel which expects this data structure
        const result = await enrollmentService.getEnrollments(null, page, limit);

        return res.json({ success: true, data: result.enrollments, count: result.total });
    } catch (err) {
        next(err);
    }
};

const getBatch1AdmissionById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!id) return res.status(400).json({ success: false, error: "Invalid id" });

        const enrollment = await prisma.enrollment.findUnique({
            where: { id },
            include: { user: true, course: true, batch: true, payments: { include: { invoice: true } } }
        });

        if (!enrollment) return res.status(404).json({ success: false, error: "Admission not found" });

        // Map to flat structure if needed, or return as is. 
        // Frontend likely expects nested or flat. 
        // Admin Panel 'Admissions.jsx' maps it manually in slice. 
        // So returning enrollment object is fine if this endpoint is used by view details.
        return res.json({ success: true, data: enrollment });
    } catch (err) {
        next(err);
    }
};

const updateBatch1Admission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Assume ID is Enrollment ID. Update User profile.
        const enrollment = await prisma.enrollment.findUnique({ where: { id: parseInt(id) } });
        if (!enrollment) return res.status(404).json({ success: false, error: "Admission not found" });

        const updatedUser = await prisma.user.update({
            where: { id: enrollment.userId },
            data: {
                fullName: data.fullName,
                email: data.email,
                contact: data.contact,
                address: data.address,
                // ... map other fields as needed
            }
        });

        return res.json({ success: true, message: "Admission updated successfully", data: updatedUser });
    } catch (err) {
        next(err);
    }
};

const deleteBatch1Admission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const enrollment = await prisma.enrollment.findUnique({ where: { id: parseInt(id) } });

        if (!enrollment) return res.status(404).json({ success: false, error: "Admission not found" });

        // Soft delete Enrollment (CANCELLED) & User (INACTIVE)
        await prisma.$transaction([
            prisma.enrollment.update({
                where: { id: parseInt(id) },
                data: { status: 'CANCELLED' }
            }),
            prisma.user.update({
                where: { id: enrollment.userId },
                data: { status: 'INACTIVE' } // Remove from Students list
            })
        ]);

        return res.json({ success: true, message: "Admission deleted successfully" });
    } catch (err) {
        next(err);
    }
};

const restoreBatch1Admission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const enrollment = await prisma.enrollment.findUnique({ where: { id: parseInt(id) } });

        if (!enrollment) return res.status(404).json({ success: false, error: "Admission not found" });

        // Restore Enrollment (PENDING) & User (INACTIVE - waits for re-enrollment logic)
        await prisma.$transaction([
            prisma.enrollment.update({
                where: { id: parseInt(id) },
                data: { status: 'PENDING' }
            }),
            prisma.user.update({
                where: { id: enrollment.userId },
                data: { status: 'INACTIVE' }
            })
        ]);

        return res.json({ success: true, message: "Admission restored successfully" });
    } catch (err) {
        next(err);
    }
};

// Enroll Student (Assign Batch & Activate)
// Originally mapped to POST /:id/enroll
const enrollStudentFromAdmission = async (req, res, next) => {
    try {
        const { id } = req.params; // Enrollment ID
        const { batchId, ...additionalData } = req.body;

        if (!batchId) {
            return res.status(400).json({ success: false, error: "Batch ID is required for enrollment" });
        }

        const enrollment = await prisma.enrollment.findUnique({ where: { id: parseInt(id) }, include: { user: true } });
        if (!enrollment) return res.status(404).json({ success: false, error: "Admission/Enrollment not found" });

        const studentService = require('../services/admin.student.service');

        // 1. Assign to Batch (This usually creates Enrollment?? No, we HAVE an enrollment).
        // If studentService.assignToBatch tries to create NEW enrollment, it will fail or duplicate.
        // We should just UPDATE the existing enrollment.

        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
                batchId: parseInt(batchId),
                status: 'ACTIVE'
            }
        });

        // 2. Activate User
        const updatedUser = await prisma.user.update({
            where: { id: enrollment.userId },
            data: {
                status: 'ACTIVE',
                // Update profile fields if provided in "Enroll Modal"
                totalFees: additionalData.totalFees ? parseFloat(additionalData.totalFees) : undefined,
                installment1Amount: additionalData.installment1Amount ? parseFloat(additionalData.installment1Amount) : undefined,
                installment1Date: additionalData.installment1Date || undefined,
                installment2Amount: additionalData.installment2Amount ? parseFloat(additionalData.installment2Amount) : undefined,
                installment2Date: additionalData.installment2Date || undefined,
                installment3Amount: additionalData.installment3Amount ? parseFloat(additionalData.installment3Amount) : undefined,
                installment3Date: additionalData.installment3Date || undefined,
            }
        });

        return res.json({ success: true, message: "Student enrolled/activated successfully", data: updatedUser });
    } catch (err) {
        next(err);
    }
};

// Enroll from Enquiry (Creates New User + Enrollment)
// This can stay similar but needs to use enrollmentService or create User/Enrollment directly
const enrollStudentFromEnquiry = async (req, res, next) => {
    try {
        const { id } = req.params;
        const additionalData = req.body || {};

        const enquiry = await prisma.enquiry.findUnique({ where: { id: parseInt(id) } });
        if (!enquiry) return res.status(404).json({ success: false, error: "Enquiry not found" });

        // Map Enquiry to Enrollment Payload
        // Similar to saveBatch1Admission logic

        // ... (implementation mapping enquiry -> enrollmentService.initiateEnrollment)

        // For brevity/safety, let's just trigger initiateEnrollment
        // assuming we can resolve courseId.

        // Find Course
        let courseId = additionalData.courseId;
        if (!courseId) {
            // Try to match preferredCourses
            const startCourse = enquiry.preferredCourses?.split(',')[0]?.trim();
            if (startCourse) {
                const course = await prisma.course.findFirst({
                    where: { title: { contains: startCourse, mode: 'insensitive' } }
                });
                courseId = course?.id;
            }
        }

        if (!courseId) return res.status(400).json({ success: false, error: "Could not determine course from enquiry" });

        const enrollmentPayload = {
            fullName: enquiry.fullName,
            email: enquiry.email,
            contact: enquiry.contact,
            courseId: courseId,
            enrollmentDetails: {
                dob: enquiry.dob,
                gender: enquiry.gender,
                emergencyName: enquiry.emergencyName,
                emergencyRelation: enquiry.emergencyRelation,
                emergencyPhone: enquiry.emergencyPhone,
                academic: {
                    educationLevel: enquiry.educationLevel
                },
                batchTiming: enquiry.batchTiming,
                ...additionalData
                // includes payment info from modal
            },
            paymentMode: additionalData.paymentMode || 'Cash'
        };

        const result = await enrollmentService.initiateEnrollment(enrollmentPayload);

        // If batchId provided, Activate immediately
        if (additionalData.batchId) {
            await prisma.enrollment.update({
                where: { id: result.enrollmentId },
                data: { batchId: parseInt(additionalData.batchId), status: 'ACTIVE' }
            });
            // Also activate user? enrollmentService initiates as INACTIVE for offline.
            // We need to activate user.
            // Find user to activate
            const enrollment = await prisma.enrollment.findUnique({ where: { id: result.enrollmentId }, select: { userId: true } });
            await prisma.user.update({ where: { id: enrollment.userId }, data: { status: 'ACTIVE' } });
        }

        // Update Enquiry Status
        await prisma.enquiry.update({
            where: { id: parseInt(id) },
            data: { status: 'Converted' }
        });

        return res.json({ success: true, message: "Student enrolled successfully from enquiry", data: result });
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
    restoreBatch1Admission,
    enrollStudentFromAdmission,
    enrollStudentFromEnquiry
};

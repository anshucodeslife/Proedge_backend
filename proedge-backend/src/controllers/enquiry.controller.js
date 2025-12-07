const prisma = require('../config/prisma');

const getEnquiries = async (req, res) => {
    try {
        const enquiries = await prisma.enquiry.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: enquiries });
    } catch (error) {
        console.error('Get Enquiries Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

const updateEnquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedEnquiry = await prisma.enquiry.update({
            where: { id: Number(id) },
            data: { status },
        });

        res.json({ success: true, message: 'Status updated successfully', data: updatedEnquiry });
    } catch (error) {
        console.error('Update Enquiry Status Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

const updateEnquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedEnquiry = await prisma.enquiry.update({
            where: { id: Number(id) },
            data: data,
        });

        res.json({ success: true, message: 'Enquiry updated successfully', data: updatedEnquiry });
    } catch (error) {
        console.error('Update Enquiry Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

const deleteEnquiry = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.enquiry.update({
            where: { id: Number(id) },
            data: { deletedAt: new Date() },
        });

        res.json({ success: true, message: 'Enquiry deleted successfully' });
    } catch (error) {
        console.error('Delete Enquiry Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

const saveEnquiry = async (req, res) => {
    try {
        const data = req.body || {};

        if (!data.fullName || !data.email || !data.contact) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        const enquiryData = {
            fullName: data.fullName,
            email: data.email,
            contact: data.contact,
            dob: data.dob || null,
            gender: data.gender || null,
            educationLevel: data.educationLevel || null,
            preferredCourses: data.preferredCourses ? (Array.isArray(data.preferredCourses) ? data.preferredCourses.join(', ') : data.preferredCourses) : null,
            otherCourse: data.otherCourse || null,
            batchTiming: data.batchTiming || null,
            emergencyName: data.emergencyName || null,
            emergencyRelation: data.emergencyRelation || null,
            emergencyPhone: data.emergencyPhone || null,
            status: "NEW"
        };

        const newEnquiry = await prisma.enquiry.create({
            data: enquiryData
        });

        return res.json({ success: true, message: "Enquiry submitted successfully", id: newEnquiry.id });

    } catch (err) {
        console.error("❌ DB ERROR:", err);
        return res.status(500).json({ error: "Database error", details: err.message });
    }
};

module.exports = {
    getEnquiries,
    updateEnquiryStatus,
    updateEnquiry,
    deleteEnquiry,
    saveEnquiry
};

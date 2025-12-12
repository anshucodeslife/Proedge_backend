const prisma = require('../config/prisma');

const getReferrals = async (req, res) => {
    try {
        const referrals = await prisma.referral.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' }
        });

        // Aggregate usage from User table
        const usageStats = await prisma.user.groupBy({
            by: ['referralCode'],
            where: {
                referralCode: { in: referrals.map(r => r.code) }
            },
            _count: { referralCode: true },
            _sum: { referralAmount: true }
        });

        const data = referrals.map(ref => {
            const stat = usageStats.find(s => s.referralCode === ref.code);
            return {
                ...ref,
                _count: { batch1admissions: stat?._count?.referralCode || 0 }, // Maintain structure for frontend if needed, or update frontend
                totalDiscount: stat?._sum?.referralAmount || 0
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get Referrals Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

const getReferralByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const referral = await prisma.referral.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!referral || referral.deletedAt || !referral.active) {
            return res.status(404).json({ success: false, error: 'Invalid or inactive referral code' });
        }

        res.json({ success: true, data: referral });
    } catch (error) {
        console.error('Get Referral By Code Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

const createReferral = async (req, res) => {
    try {
        const { code, discount, active } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: 'Referral code is required' });
        }

        const existing = await prisma.referral.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (existing && !existing.deletedAt) {
            return res.status(400).json({ success: false, error: 'Referral code already exists' });
        }

        const referral = await prisma.referral.create({
            data: {
                code: code.toUpperCase(),
                discount: parseFloat(discount) || 5.0,
                active: active !== undefined ? active : true
            }
        });

        res.json({ success: true, data: referral });
    } catch (error) {
        console.error('Create Referral Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

const updateReferral = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, discount, active } = req.body;

        const referral = await prisma.referral.update({
            where: { id: parseInt(id) },
            data: {
                code: code ? code.toUpperCase() : undefined,
                discount: discount ? parseFloat(discount) : undefined,
                active: active !== undefined ? active : undefined
            }
        });

        res.json({ success: true, data: referral });
    } catch (error) {
        console.error('Update Referral Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

const deleteReferral = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.referral.update({
            where: { id: parseInt(id) },
            data: { deletedAt: new Date() },
        });

        res.json({ success: true, message: 'Referral deleted successfully' });
    } catch (error) {
        console.error('Delete Referral Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Public endpoint for frontend validation
const validateReferral = async (req, res) => {
    return getReferralByCode(req, res);
};

// Public endpoint for referral whiteboard/stats
const getReferralStats = async (req, res) => {
    try {
        const { code } = req.query;

        const where = { deletedAt: null };
        if (code) {
            where.code = code.toUpperCase();
        }

        const referrals = await prisma.referral.findMany({ where });

        const usageStats = await prisma.user.groupBy({
            by: ['referralCode'],
            where: {
                referralCode: { in: referrals.map(r => r.code) }
                // status: 'ACTIVE'
            },
            _count: { referralCode: true },
            _sum: { referralAmount: true }
        });

        const data = referrals.map(ref => {
            const stat = usageStats.find(s => s.referralCode === ref.code);
            return {
                referral_code: ref.code,
                usages: stat?._count?.referralCode || 0,
                total_amount: stat?._sum?.referralAmount || 0
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('Get Referral Stats Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Public endpoint for fetching students by referral
const getStudentsByReferral = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.status(400).json({ success: false, error: 'Code is required' });
        }

        const referral = await prisma.referral.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!referral) {
            return res.json({ success: true, data: [] });
        }

        // Query users table for students who used this code
        const students = await prisma.user.findMany({
            where: {
                referralCode: code.toUpperCase(),
                role: 'STUDENT'
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                contact: true,
                courseName: true,
                totalFees: true,
                originalFees: true,
                createdAt: true
            }
        });

        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Get Students By Referral Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

module.exports = {
    getReferrals,
    getReferralByCode,
    validateReferral,
    getReferralStats,
    getStudentsByReferral,
    createReferral,
    updateReferral,
    deleteReferral
};

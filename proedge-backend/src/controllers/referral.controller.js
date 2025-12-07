const prisma = require('../config/prisma');

const getReferrals = async (req, res) => {
    try {
        const referrals = await prisma.referral.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { batch1admissions: true } // Changed from students to batch1admissions as per Relation Name
                },
                batch1admissions: {
                    select: { referralAmount: true }
                }
            }
        });

        const data = referrals.map(ref => {
            const totalDiscount = ref.batch1admissions.reduce((sum, s) => sum + (Number(s.referralAmount) || 0), 0);
            const { batch1admissions, ...rest } = ref;
            return { ...rest, totalDiscount };
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

module.exports = {
    getReferrals,
    getReferralByCode,
    createReferral,
    updateReferral,
    deleteReferral
};

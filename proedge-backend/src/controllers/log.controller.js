const prisma = require('../config/prisma');

const getLogs = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 100, 1000);
        const offset = parseInt(req.query.offset) || 0;
        const action = req.query.action || null;
        const entity = req.query.entity || null;

        const where = {};
        if (action) where.action = action;
        if (entity) where.entity = entity;

        const logs = await prisma.auditLog.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
        });

        const count = await prisma.auditLog.count({ where });

        return res.json({ success: true, data: logs, count });
    } catch (err) {
        console.error("❌ DB ERROR:", err);
        return res.status(500).json({ success: false, error: "Database error", details: err.message });
    }
};

// Helper function exported for internal use
const createLog = async (action, entity, entityId, details, performedBy) => {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId: String(entityId),
                details: details || {},
                performedBy: performedBy || 'System',
            },
        });
    } catch (err) {
        console.error("❌ LOG ERROR:", err);
    }
};

module.exports = {
    getLogs,
    createLog
};

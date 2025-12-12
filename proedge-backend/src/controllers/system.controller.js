const prisma = require('../config/prisma');
const crypto = require('crypto');

// Helper to hash IP
const hashIP = (ip) => {
    return crypto.createHash('sha256').update(ip).digest('hex');
};

const trackVisit = async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const hashedIP = hashIP(ip || '127.0.0.1');
        const userAgent = req.headers['user-agent'];
        const page = req.body.page || req.originalUrl;

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const existingVisit = await prisma.visitLog.findFirst({
            where: {
                ip: hashedIP,
                createdAt: { gte: todayStart }
            }
        });

        if (!existingVisit) {
            await prisma.visitLog.create({
                data: {
                    ip: hashedIP,
                    userAgent: userAgent,
                    page: page,
                },
            });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Track Visit Error:', error);
        res.status(200).json({ success: true }); // Fail silently
    }
};

const getSettings = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value;
        });
        res.json({ success: true, data: settingsMap });
    } catch (error) {
        console.error('Get Settings Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        const promises = Object.keys(updates).map(key => {
            return prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(updates[key]) },
                create: { key, value: String(updates[key]) }
            });
        });

        await Promise.all(promises);
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

const getTrafficStats = async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const [
            totalViewsToday,
            uniqueVisitorsToday,
            totalViewsYesterday,
            uniqueVisitorsYesterday,
            viewsLastHour,
            hourlyStats
        ] = await Promise.all([
            prisma.visitLog.count({ where: { createdAt: { gte: todayStart } } }),
            prisma.visitLog.groupBy({
                by: ['ip'],
                where: { createdAt: { gte: todayStart } },
            }).then(res => res.length),
            prisma.visitLog.count({
                where: { createdAt: { gte: yesterdayStart, lt: todayStart } }
            }),
            prisma.visitLog.groupBy({
                by: ['ip'],
                where: { createdAt: { gte: yesterdayStart, lt: todayStart } },
            }).then(res => res.length),
            prisma.visitLog.count({ where: { createdAt: { gte: oneHourAgo } } }),
            prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('hour', created_at) as hour,
          COUNT(*) as count
        FROM visit_logs
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY hour
        ORDER BY hour ASC
      `
        ]);

        const chartData = hourlyStats.map(stat => ({
            time: new Date(stat.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            visits: Number(stat.count)
        }));

        res.json({
            success: true,
            data: {
                today: { views: totalViewsToday, unique: uniqueVisitorsToday },
                yesterday: { views: totalViewsYesterday, unique: uniqueVisitorsYesterday },
                lastHour: { views: viewsLastHour },
                chart: chartData
            }
        });

    } catch (error) {
        console.error('Get Traffic Stats Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const resetData = async (req, res) => {
    try {
        console.log('⚠️ RESET DATA REQUESTED BY ADMIN');

        // Execute in transaction to ensure integrity
        await prisma.$transaction(async (tx) => {
            // 1. Delete dependent transactional data first
            await tx.invoice.deleteMany({});
            await tx.payment.deleteMany({});
            await tx.enrollmentHistory.deleteMany({});
            await tx.enrollment.deleteMany({});
            await tx.attendance.deleteMany({});
            await tx.watchLog.deleteMany({});
            await tx.notification.deleteMany({});

            // 2. Delete all Enquiries and Logs
            await tx.enquiry.deleteMany({});
            // visit_logs is mapped to 'visit_logs' table in prisma but model is VisitLog
            await tx.visitLog.deleteMany({});
            await tx.auditLog.deleteMany({});

            // 3. Delete Users EXCEPT Admins/SuperAdmins
            const result = await tx.user.deleteMany({
                where: {
                    role: {
                        notIn: ['ADMIN', 'SUPERADMIN']
                    }
                }
            });

            console.log(`Deleted ${result.count} students/users.`);
        });

        res.json({ success: true, message: 'System reset complete. All students and transactional data cleared.' });
    } catch (error) {
        console.error('Reset Data Error:', error);
        res.status(500).json({ success: false, error: 'Failed to reset data', details: error.message });
    }
};

module.exports = {
    trackVisit,
    getSettings,
    updateSettings,
    getTrafficStats,
    resetData
};

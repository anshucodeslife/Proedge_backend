const prisma = require('../config/prisma');

const getOverviewStats = async () => {
  const [totalStudents, totalCourses, activeEnrollments, totalRevenue] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.course.count(),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    }),
  ]);
  
  return {
    totalStudents,
    totalCourses,
    activeEnrollments,
    totalRevenue: totalRevenue._sum.amount || 0,
  };
};

const getVideoEngagement = async () => {
  const watchLogs = await prisma.watchLog.findMany({
    include: { lesson: true },
  });
  
  const lessonStats = {};
  watchLogs.forEach(log => {
    const lessonId = log.lessonId;
    if (!lessonStats[lessonId]) {
      lessonStats[lessonId] = {
        lessonTitle: log.lesson.title,
        totalWatched: 0,
        totalDuration: log.lesson.durationSec || 1,
        count: 0,
      };
    }
    lessonStats[lessonId].totalWatched += log.watchedSec;
    lessonStats[lessonId].count += 1;
  });
  
  const topVideos = Object.values(lessonStats)
    .map(stat => ({
      title: stat.lessonTitle,
      avgWatchPercent: ((stat.totalWatched / stat.count) / stat.totalDuration) * 100,
      views: stat.count,
    }))
    .sort((a, b) => b.avgWatchPercent - a.avgWatchPercent)
    .slice(0, 10);
    
  return { topVideos };
};

module.exports = {
  getOverviewStats,
  getVideoEngagement,
};

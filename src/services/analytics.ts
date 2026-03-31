import prisma from '../utils/prisma';

export async function getUserAnalytics(userId: number) {
  const [assessments, moodLogs, theoryProgress] = await Promise.all([
    prisma.assessment.findMany({
      where: { userId },
      include: { questionnaire: { select: { title: true, categoryId: true } } },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.moodLog.findMany({
      where: { userId, date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { date: 'asc' },
    }),
    prisma.theoryProgress.findMany({
      where: { userId },
      include: { theorySession: { select: { title: true } } },
    }),
  ]);

  // Category scores from assessments
  const categoryScores: Record<number, { total: number; count: number }> = {};
  for (const a of assessments) {
    const catId = a.questionnaire.categoryId;
    if (!categoryScores[catId]) categoryScores[catId] = { total: 0, count: 0 };
    categoryScores[catId].total += a.score;
    categoryScores[catId].count += 1;
  }

  // Get category names
  const catIds = Object.keys(categoryScores).map(Number);
  const categories = await prisma.category.findMany({
    where: { id: { in: catIds } },
    select: { id: true, name: true },
  });

  const categoryBreakdown = categories.map((c) => ({
    name: c.name,
    score: Math.round(categoryScores[c.id].total / categoryScores[c.id].count),
  }));

  // Weekly mood: return 7 numbers aligned Mon–Sun (0 = no data)
  const weeklyMood: number[] = Array(7).fill(0);
  for (const m of moodLogs.slice(-7)) {
    const day = new Date(m.date).getDay(); // 0=Sun, 1=Mon…6=Sat
    const idx = day === 0 ? 6 : day - 1;  // convert to Mon=0…Sun=6
    weeklyMood[idx] = m.mood;
  }

  return {
    totalAssessments: assessments.length,
    avgScore: assessments.length > 0
      ? Math.round(assessments.reduce((s, a) => s + a.score, 0) / assessments.length)
      : 0,
    categoryBreakdown,
    weeklyMood,
    theoryCompleted: theoryProgress.filter((p) => p.completed).length,
    theoryInProgress: theoryProgress.filter((p) => !p.completed).length,
    recentAssessments: assessments.slice(0, 5).map((a) => ({
      id: a.id,
      title: a.questionnaire.title,
      score: a.score,
      date: a.completedAt,
    })),
  };
}

export async function getAdminAnalytics() {
  const [totalUsers, activeUsers, totalCounsellors, totalAssessments,
    recentUsers, categoryDistribution, registrationTrend] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.counsellor.count({ where: { status: 'ACTIVE' } }),
    prisma.assessment.count(),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.assessment.groupBy({
      by: ['questionnaireId'],
      _count: true,
    }),
    prisma.user.groupBy({
      by: ['createdAt'],
      _count: true,
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Get category distribution with names
  const qIds = categoryDistribution.map((d) => d.questionnaireId);
  const questionnaires = await prisma.questionnaire.findMany({
    where: { id: { in: qIds } },
    select: { id: true, title: true, categoryId: true },
  });
  const catIds = [...new Set(questionnaires.map((q) => q.categoryId))];
  const cats = await prisma.category.findMany({
    where: { id: { in: catIds } },
    select: { id: true, name: true },
  });

  const distribution = categoryDistribution.map((d) => {
    const q = questionnaires.find((q) => q.id === d.questionnaireId);
    const cat = cats.find((c) => c.id === q?.categoryId);
    return { category: cat?.name || 'Unknown', count: d._count };
  });

  return {
    totalUsers,
    activeUsers,
    totalCounsellors,
    totalAssessments,
    completionRate: totalAssessments > 0 ? Math.round((totalAssessments / Math.max(totalUsers, 1)) * 100) : 0,
    recentUsers,
    categoryDistribution: distribution,
    monthlyRegistrations: registrationTrend.slice(-12),
  };
}

export async function exportAnalyticsCSV() {
  const assessments = await prisma.assessment.findMany({
    include: {
      user: { select: { name: true, email: true } },
      questionnaire: { select: { title: true } },
    },
    orderBy: { completedAt: 'desc' },
  });

  const header = 'User Name,Email,Questionnaire,Score,Date\n';
  const rows = assessments.map((a) =>
    `"${a.user.name}","${a.user.email}","${a.questionnaire.title}",${a.score},"${a.completedAt.toISOString()}"`
  ).join('\n');

  return Buffer.from(header + rows);
}

import prisma from '../utils/prisma';

export async function logMood(userId: number, mood: number) {
  return prisma.moodLog.create({
    data: { userId, mood },
  });
}

export async function getMoodHistory(userId: number, days: number = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return prisma.moodLog.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: 'desc' },
  });
}

import prisma from '../utils/prisma';

export async function listExercises(page: number, limit: number, category?: string) {
  const where: any = { status: 'ACTIVE' };
  if (category) where.category = category;

  const [data, total] = await Promise.all([
    prisma.breathingExercise.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'asc' },
    }),
    prisma.breathingExercise.count({ where }),
  ]);

  return { data, pagination: { page, limit, total } };
}

export async function getExerciseById(id: number) {
  const exercise = await prisma.breathingExercise.findUnique({ where: { id } });
  if (!exercise) {
    throw { status: 404, message: 'Breathing exercise not found', code: 'NOT_FOUND' };
  }
  return exercise;
}

export async function createExercise(data: {
  name: string; description: string; inhaleSeconds: number; holdSeconds: number;
  exhaleSeconds: number; holdAfterExhale?: number; defaultCycles?: number; category?: string;
}) {
  return prisma.breathingExercise.create({ data: data as any });
}

export async function updateExercise(id: number, data: any) {
  const existing = await prisma.breathingExercise.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Breathing exercise not found', code: 'NOT_FOUND' };
  }
  return prisma.breathingExercise.update({ where: { id }, data });
}

export async function deleteExercise(id: number) {
  const existing = await prisma.breathingExercise.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Breathing exercise not found', code: 'NOT_FOUND' };
  }
  await prisma.breathingExercise.update({ where: { id }, data: { status: 'INACTIVE' } });
}

export async function toggleFavourite(userId: number, exerciseId: number) {
  const existing = await prisma.breathingFavourite.findUnique({
    where: { userId_exerciseId: { userId, exerciseId } },
  });

  if (existing) {
    await prisma.breathingFavourite.delete({ where: { id: existing.id } });
    return { favourited: false };
  }

  await prisma.breathingFavourite.create({ data: { userId, exerciseId } });
  return { favourited: true };
}

export async function getFavourites(userId: number) {
  return prisma.breathingFavourite.findMany({
    where: { userId },
    include: { exercise: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function logCompletion(userId: number, data: {
  exerciseId: number; cycles: number; durationSec: number;
}) {
  return prisma.breathingHistory.create({
    data: { userId, ...data },
  });
}

export async function getHistory(userId: number, page: number, limit: number) {
  const [data, total] = await Promise.all([
    prisma.breathingHistory.findMany({
      where: { userId },
      include: { exercise: { select: { name: true, category: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { completedAt: 'desc' },
    }),
    prisma.breathingHistory.count({ where: { userId } }),
  ]);

  return { data, pagination: { page, limit, total } };
}

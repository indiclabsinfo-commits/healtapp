import prisma from '../utils/prisma';

export async function listTheorySessions(page: number, limit: number, status?: string) {
  const where: any = {};
  if (status) where.status = status;

  const [data, total] = await Promise.all([
    prisma.theorySession.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.theorySession.count({ where }),
  ]);

  return { data, pagination: { page, limit, total } };
}

export async function getTheorySessionById(id: number) {
  const session = await prisma.theorySession.findUnique({ where: { id } });
  if (!session) {
    throw { status: 404, message: 'Theory session not found', code: 'NOT_FOUND' };
  }
  return session;
}

export async function createTheorySession(data: {
  title: string; description: string; modules: any; duration: number; status?: string;
}) {
  return prisma.theorySession.create({
    data: { ...data, status: data.status || 'draft' },
  });
}

export async function updateTheorySession(id: number, data: any) {
  const existing = await prisma.theorySession.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Theory session not found', code: 'NOT_FOUND' };
  }
  return prisma.theorySession.update({ where: { id }, data });
}

export async function deleteTheorySession(id: number) {
  const existing = await prisma.theorySession.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Theory session not found', code: 'NOT_FOUND' };
  }
  await prisma.theorySession.delete({ where: { id } });
}

export async function updateProgress(userId: number, sessionId: number, data: {
  completedModules: number[]; completed?: boolean;
}) {
  const session = await prisma.theorySession.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw { status: 404, message: 'Theory session not found', code: 'NOT_FOUND' };
  }

  return prisma.theoryProgress.upsert({
    where: { userId_theorySessionId: { userId, theorySessionId: sessionId } },
    create: {
      userId,
      theorySessionId: sessionId,
      completedModules: data.completedModules,
      completed: data.completed || false,
    },
    update: {
      completedModules: data.completedModules,
      completed: data.completed || false,
    },
  });
}

export async function getProgress(userId: number, sessionId: number) {
  return prisma.theoryProgress.findUnique({
    where: { userId_theorySessionId: { userId, theorySessionId: sessionId } },
  });
}

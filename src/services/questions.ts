import prisma from '../utils/prisma';

export async function createQuestion(data: {
  text: string; type: string; options: any; levelId: number;
}) {
  const level = await prisma.level.findUnique({ where: { id: data.levelId } });
  if (!level) {
    throw { status: 404, message: 'Level not found', code: 'NOT_FOUND' };
  }

  // Server-side dupe check (case-insensitive) — frontend check is best-effort
  // and can race when the list is stale. This is the authoritative guard.
  const existing = await prisma.question.findFirst({
    where: {
      levelId: data.levelId,
      text: { equals: data.text.trim(), mode: 'insensitive' },
    },
  });
  if (existing) {
    throw {
      status: 409,
      message: 'A question with this text already exists in this level',
      code: 'DUPLICATE_QUESTION',
    };
  }

  return prisma.question.create({
    data: { ...data, text: data.text.trim() } as any,
  });
}

export async function updateQuestion(id: number, data: {
  text?: string; type?: string; options?: any;
}) {
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Question not found', code: 'NOT_FOUND' };
  }

  return prisma.question.update({
    where: { id },
    data: data as any,
  });
}

export async function deleteQuestion(id: number) {
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Question not found', code: 'NOT_FOUND' };
  }

  await prisma.question.delete({ where: { id } });
}

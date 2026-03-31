import prisma from '../utils/prisma';

export async function createQuestion(data: {
  text: string; type: string; options: any; levelId: number;
}) {
  const level = await prisma.level.findUnique({ where: { id: data.levelId } });
  if (!level) {
    throw { status: 404, message: 'Level not found', code: 'NOT_FOUND' };
  }

  return prisma.question.create({
    data: data as any,
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

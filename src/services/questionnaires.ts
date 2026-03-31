import prisma from '../utils/prisma';

function parseQuestionIds(raw: any): number[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

export async function listQuestionnaires(page: number, limit: number, published?: boolean) {
  const where: any = {};
  if (published !== undefined) where.published = published;

  const [data, total] = await Promise.all([
    prisma.questionnaire.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.questionnaire.count({ where }),
  ]);

  // Ensure questionIds is always a proper array
  const parsed = data.map((q) => ({ ...q, questionIds: parseQuestionIds(q.questionIds) }));
  return { data: parsed, pagination: { page, limit, total } };
}

export async function getQuestionnaireById(id: number) {
  const questionnaire = await prisma.questionnaire.findUnique({ where: { id } });
  if (!questionnaire) {
    throw { status: 404, message: 'Questionnaire not found', code: 'NOT_FOUND' };
  }

  // Fetch the actual questions
  const questionIds = parseQuestionIds(questionnaire.questionIds);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });

  return { ...questionnaire, questions };
}

export async function createQuestionnaire(data: {
  title: string; categoryId: number; levelId: number; questionIds: number[]; published?: boolean;
}) {
  return prisma.questionnaire.create({ data: { ...data, questionIds: data.questionIds } });
}

export async function updateQuestionnaire(id: number, data: {
  title?: string; questionIds?: number[]; published?: boolean;
}) {
  const existing = await prisma.questionnaire.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Questionnaire not found', code: 'NOT_FOUND' };
  }

  return prisma.questionnaire.update({ where: { id }, data });
}

export async function deleteQuestionnaire(id: number) {
  const existing = await prisma.questionnaire.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Questionnaire not found', code: 'NOT_FOUND' };
  }

  await prisma.questionnaire.delete({ where: { id } });
}

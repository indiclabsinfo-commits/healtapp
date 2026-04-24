import prisma from '../utils/prisma';

export async function submitAssessment(userId: number, data: {
  questionnaireId: number;
  answers: Array<{ questionId: number; answer: any }>;
}) {
  const questionnaire = await prisma.questionnaire.findUnique({
    where: { id: data.questionnaireId },
  });
  if (!questionnaire || !questionnaire.published) {
    throw { status: 404, message: 'Questionnaire not found or not published', code: 'NOT_FOUND' };
  }

  // Auto-score: count correct answers for MCQ, average for SCALE, count yes for YESNO
  const questionIds = questionnaire.questionIds as number[];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  });

  let totalPoints = 0;
  let maxPoints = 0;

  for (const q of questions) {
    const userAnswer = data.answers.find((a) => a.questionId === q.id);
    if (!userAnswer) continue;

    const options = q.options as any;

    if (q.type === 'MCQ') {
      // Scored MCQ (e.g. GAD-7, PHQ-9): options are [{text, score}, ...]
      if (Array.isArray(options) && options.length > 0 && options[0]?.score !== undefined) {
        const maxScore = Math.max(...options.map((o: any) => Number(o.score) || 0));
        maxPoints += maxScore;
        const chosen = options.find((o: any) => o.text === userAnswer.answer);
        totalPoints += chosen ? Number(chosen.score) || 0 : 0;
      } else {
        // Traditional correct/wrong MCQ
        maxPoints += 1;
        if (options.correct !== undefined && userAnswer.answer === options.correct) {
          totalPoints += 1;
        }
      }
    } else if (q.type === 'SCALE') {
      const max = options.max || 10;
      maxPoints += max;
      totalPoints += Math.min(Number(userAnswer.answer) || 0, max);
    } else if (q.type === 'YESNO') {
      maxPoints += 1;
      totalPoints += userAnswer.answer === true || userAnswer.answer === 'yes' ? 1 : 0;
    }
  }

  const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

  return prisma.assessment.create({
    data: {
      userId,
      questionnaireId: data.questionnaireId,
      answers: data.answers,
      score,
    },
    include: {
      questionnaire: { select: { title: true, categoryId: true } },
    },
  });
}

export async function getUserAssessments(userId: number, page: number, limit: number) {
  const [data, total] = await Promise.all([
    prisma.assessment.findMany({
      where: { userId },
      include: { questionnaire: { select: { title: true, categoryId: true, language: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { completedAt: 'desc' },
    }),
    prisma.assessment.count({ where: { userId } }),
  ]);
  return { data, pagination: { page, limit, total } };
}

export async function getMyAssessments(userId: number, page: number, limit: number) {
  const [data, total] = await Promise.all([
    prisma.assessment.findMany({
      where: { userId },
      include: { questionnaire: { select: { title: true, categoryId: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { completedAt: 'desc' },
    }),
    prisma.assessment.count({ where: { userId } }),
  ]);

  return { data, pagination: { page, limit, total } };
}

export async function getAssessmentById(userId: number, id: number) {
  const assessment = await prisma.assessment.findFirst({
    where: { id, userId },
    include: { questionnaire: { select: { title: true, categoryId: true, levelId: true } } },
  });

  if (!assessment) {
    throw { status: 404, message: 'Assessment not found', code: 'NOT_FOUND' };
  }

  return assessment;
}

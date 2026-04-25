import prisma from '../utils/prisma';
import { sendPushBatch } from '../utils/push';

export async function createAssignment(userId: number, orgId: number, data: {
  type: string;
  questionnaireId?: number;
  theorySessionId?: number;
  targetType: string;
  targetValue?: string;
  title: string;
  description?: string;
  deadline?: string;
  mandatory?: boolean;
}) {
  // Validate the linked resource exists
  if (data.type === 'ASSESSMENT' && data.questionnaireId) {
    const questionnaire = await prisma.questionnaire.findUnique({ where: { id: data.questionnaireId } });
    if (!questionnaire) {
      throw { status: 404, message: 'Questionnaire not found', code: 'NOT_FOUND' };
    }
  }

  if (data.type === 'THEORY' && data.theorySessionId) {
    const theorySession = await prisma.theorySession.findUnique({ where: { id: data.theorySessionId } });
    if (!theorySession) {
      throw { status: 404, message: 'Theory session not found', code: 'NOT_FOUND' };
    }
  }

  const assignment = await prisma.assignment.create({
    data: {
      organizationId: orgId,
      assignedById: userId,
      type: data.type,
      questionnaireId: data.questionnaireId || null,
      theorySessionId: data.theorySessionId || null,
      targetType: data.targetType,
      targetValue: data.targetValue || null,
      title: data.title,
      description: data.description || null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      mandatory: data.mandatory || false,
    },
    include: {
      assignedBy: { select: { id: true, name: true } },
    },
  });

  // Notify target students
  try {
    let targetUsers: { pushToken: string | null }[] = [];
    if (data.targetType === 'ALL') {
      targetUsers = await prisma.user.findMany({
        where: { memberships: { some: { organizationId: orgId } } },
        select: { pushToken: true },
      });
    } else if (data.targetType === 'CLASS' && data.targetValue) {
      targetUsers = await prisma.user.findMany({
        where: { memberships: { some: { organizationId: orgId, class: data.targetValue } } },
        select: { pushToken: true },
      });
    } else if (data.targetType === 'DEPARTMENT' && data.targetValue) {
      targetUsers = await prisma.user.findMany({
        where: { memberships: { some: { organizationId: orgId, department: data.targetValue } } },
        select: { pushToken: true },
      });
    }
    await sendPushBatch(
      targetUsers.map((u) => u.pushToken),
      'New Assignment',
      `${data.title} — assigned by ${assignment.assignedBy.name}`,
      { assignmentId: assignment.id, type: 'NEW_ASSIGNMENT' },
    );
  } catch { /* non-critical */ }

  return assignment;
}

export async function listAssignments(orgId: number, page: number, limit: number) {
  const where = { organizationId: orgId };

  const [data, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      include: {
        assignedBy: { select: { id: true, name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.assignment.count({ where }),
  ]);

  return { data, pagination: { page, limit, total } };
}

export async function getMyAssignments(userId: number, orgId: number) {
  // Get user's membership to know their class/department
  const membership = await prisma.organizationMember.findFirst({
    where: { userId, organizationId: orgId },
  });

  if (!membership) {
    return [];
  }

  // Build conditions for matching assignments
  const orConditions: any[] = [
    { targetType: 'ALL', organizationId: orgId, status: 'ACTIVE' },
  ];

  if (membership.class) {
    orConditions.push({
      targetType: 'CLASS',
      targetValue: membership.class,
      organizationId: orgId,
      status: 'ACTIVE',
    });
  }

  if (membership.department) {
    orConditions.push({
      targetType: 'DEPARTMENT',
      targetValue: membership.department,
      organizationId: orgId,
      status: 'ACTIVE',
    });
  }

  orConditions.push({
    targetType: 'INDIVIDUAL',
    targetValue: String(userId),
    organizationId: orgId,
    status: 'ACTIVE',
  });

  const assignments = await prisma.assignment.findMany({
    where: { OR: orConditions },
    include: {
      assignedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Check completion status for each assignment
  const enriched = await Promise.all(
    assignments.map(async (assignment) => {
      let completed = false;

      if (assignment.type === 'ASSESSMENT' && assignment.questionnaireId) {
        const existing = await prisma.assessment.findFirst({
          where: { userId, questionnaireId: assignment.questionnaireId },
        });
        completed = !!existing;
      }

      if (assignment.type === 'THEORY' && assignment.theorySessionId) {
        const progress = await prisma.theoryProgress.findUnique({
          where: {
            userId_theorySessionId: {
              userId,
              theorySessionId: assignment.theorySessionId,
            },
          },
        });
        completed = !!progress?.completed;
      }

      return { ...assignment, completed };
    })
  );

  return enriched;
}

export async function updateAssignment(id: number, data: {
  type?: string;
  questionnaireId?: number | null;
  theorySessionId?: number | null;
  targetType?: string;
  targetValue?: string | null;
  title?: string;
  description?: string | null;
  deadline?: string | null;
  mandatory?: boolean;
  status?: string;
}) {
  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Assignment not found', code: 'NOT_FOUND' };
  }

  const updateData: any = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.questionnaireId !== undefined) updateData.questionnaireId = data.questionnaireId;
  if (data.theorySessionId !== undefined) updateData.theorySessionId = data.theorySessionId;
  if (data.targetType !== undefined) updateData.targetType = data.targetType;
  if (data.targetValue !== undefined) updateData.targetValue = data.targetValue;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;
  if (data.mandatory !== undefined) updateData.mandatory = data.mandatory;
  if (data.status !== undefined) updateData.status = data.status;

  return prisma.assignment.update({
    where: { id },
    data: updateData,
    include: {
      assignedBy: { select: { id: true, name: true } },
    },
  });
}

export async function deleteAssignment(id: number) {
  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Assignment not found', code: 'NOT_FOUND' };
  }

  return prisma.assignment.update({
    where: { id },
    data: { status: 'INACTIVE' },
    include: {
      assignedBy: { select: { id: true, name: true } },
    },
  });
}

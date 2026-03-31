import prisma from '../utils/prisma';

export async function createLog(
  teacherId: number,
  organizationId: number,
  data: {
    studentId: number;
    category: 'ACADEMIC' | 'SOCIAL' | 'EMOTIONAL' | 'BEHAVIORAL';
    severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    notes: string;
    flagForCounseling: boolean;
    date?: string;
  }
) {
  // Verify the student belongs to the same organization
  const studentMembership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: data.studentId,
        organizationId,
      },
    },
  });

  if (!studentMembership || studentMembership.role !== 'STUDENT') {
    throw { status: 400, message: 'Student not found in this organization', code: 'STUDENT_NOT_FOUND' };
  }

  return prisma.behaviorLog.create({
    data: {
      studentId: data.studentId,
      teacherId,
      organizationId,
      date: data.date ? new Date(data.date) : new Date(),
      category: data.category,
      severity: data.severity,
      notes: data.notes,
      flagForCounseling: data.flagForCounseling,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      teacher: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getLogsByClass(
  organizationId: number,
  className: string | undefined,
  page: number,
  limit: number,
  studentId?: number
) {
  const where: any = { organizationId };

  if (studentId) {
    where.studentId = studentId;
  } else if (className) {
    // Find all students in this class
    const classMembers = await prisma.organizationMember.findMany({
      where: { organizationId, class: className, role: 'STUDENT' },
      select: { userId: true },
    });
    where.studentId = { in: classMembers.map((m) => m.userId) };
  }

  const [data, total] = await Promise.all([
    prisma.behaviorLog.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true } },
        teacher: { select: { id: true, name: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.behaviorLog.count({ where }),
  ]);

  return { data, pagination: { page, limit, total } };
}

export async function getFlaggedStudents(organizationId: number) {
  const flagged = await prisma.behaviorLog.findMany({
    where: {
      organizationId,
      flagForCounseling: true,
      counselingStatus: { in: ['NONE', 'PENDING'] },
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return flagged;
}

export async function updateCounselingStatus(
  logId: number,
  status: 'NONE' | 'PENDING' | 'SCHEDULED' | 'COMPLETED'
) {
  const existing = await prisma.behaviorLog.findUnique({ where: { id: logId } });
  if (!existing) {
    throw { status: 404, message: 'Behavior log not found', code: 'NOT_FOUND' };
  }

  return prisma.behaviorLog.update({
    where: { id: logId },
    data: { counselingStatus: status },
    include: {
      student: { select: { id: true, name: true, email: true } },
      teacher: { select: { id: true, name: true } },
    },
  });
}

import bcrypt from 'bcryptjs';
import fs from 'fs';
import csv from 'csv-parser';
import prisma from '../utils/prisma';

function generateOrgCode(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((w) => w[0].toUpperCase())
    .join('');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${initials}${rand}`.slice(0, 10);
}

async function uniqueCode(name: string): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateOrgCode(name);
    const exists = await prisma.organization.findUnique({ where: { code } });
    if (!exists) return code;
  }
  return `ORG${Date.now().toString(36).toUpperCase()}`;
}

export async function validateCode(code: string) {
  const org = await prisma.organization.findUnique({
    where: { code },
    select: { id: true, name: true, type: true, logo: true, status: true },
  });

  if (!org || org.status === 'INACTIVE') {
    throw { status: 404, message: 'Invalid organization code', code: 'ORG_NOT_FOUND' };
  }

  return { id: org.id, name: org.name, type: org.type, logo: org.logo };
}

export async function listOrganizations(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true } },
      },
    }),
    prisma.organization.count(),
  ]);

  return { organizations, total };
}

export async function getOrganizationById(id: number) {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: { select: { members: true } },
    },
  });

  if (!org) {
    throw { status: 404, message: 'Organization not found', code: 'ORG_NOT_FOUND' };
  }

  return org;
}

export async function createOrganization(data: {
  name: string;
  type: 'SCHOOL' | 'CORPORATE';
  code: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}) {
  const existing = await prisma.organization.findUnique({ where: { code: data.code } });
  if (existing) {
    throw { status: 409, message: 'Organization code already exists', code: 'CODE_EXISTS' };
  }

  const org = await prisma.organization.create({
    data,
  });

  return org;
}

export async function updateOrganization(id: number, data: {
  name?: string;
  type?: 'SCHOOL' | 'CORPORATE';
  code?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}) {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) {
    throw { status: 404, message: 'Organization not found', code: 'ORG_NOT_FOUND' };
  }

  // If code is being changed, check uniqueness
  if (data.code && data.code !== org.code) {
    const codeExists = await prisma.organization.findUnique({ where: { code: data.code } });
    if (codeExists) {
      throw { status: 409, message: 'Organization code already exists', code: 'CODE_EXISTS' };
    }
  }

  const updated = await prisma.organization.update({
    where: { id },
    data,
  });

  return updated;
}

export async function deleteOrganization(id: number) {
  const org = await prisma.organization.findUnique({ where: { id } });
  if (!org) {
    throw { status: 404, message: 'Organization not found', code: 'ORG_NOT_FOUND' };
  }

  const updated = await prisma.organization.update({
    where: { id },
    data: { status: 'INACTIVE' },
  });

  return updated;
}

export async function getOrgMembers(orgId: number, page: number, limit: number, filters?: {
  role?: string;
  class?: string;
  flagged?: boolean;
  counsellorMemberId?: number;
  search?: string;
}) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw { status: 404, message: 'Organization not found', code: 'ORG_NOT_FOUND' };
  }

  const where: any = { organizationId: orgId };

  if (filters?.role) where.role = filters.role;
  if (filters?.class) where.class = { contains: filters.class };
  if (filters?.search) {
    where.user = {
      OR: [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
      ],
    };
  }

  // If filtering by assigned counsellor, restrict via CounsellorAssignment
  if (filters?.counsellorMemberId !== undefined) {
    where.assignedTo = {
      some: { counsellorMemberId: filters.counsellorMemberId },
    };
  }

  // If filtering by flagged, restrict to students who have a flagged behavior log
  if (filters?.flagged) {
    where.user = {
      ...(where.user || {}),
      behaviorLogsAsStudent: {
        some: { flagForCounseling: true, organizationId: orgId },
      },
    };
  }

  const skip = (page - 1) * limit;

  const [members, total] = await Promise.all([
    prisma.organizationMember.findMany({
      where,
      skip,
      take: limit,
      orderBy: { joinedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true, status: true },
        },
        assignedTo: {
          include: {
            counsellorMember: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.organizationMember.count({ where }),
  ]);

  return { members, total };
}

// ── Counsellor Assignments ──────────────────────────────────────────────────

export async function assignStudentToCounsellor(
  orgId: number,
  studentMemberId: number,
  counsellorMemberId: number,
  assignedById: number,
) {
  const [student, counsellor] = await Promise.all([
    prisma.organizationMember.findFirst({ where: { id: studentMemberId, organizationId: orgId } }),
    prisma.organizationMember.findFirst({ where: { id: counsellorMemberId, organizationId: orgId } }),
  ]);
  if (!student) throw { status: 404, message: 'Student not found in org', code: 'NOT_FOUND' };
  if (!counsellor) throw { status: 404, message: 'Counsellor not found in org', code: 'NOT_FOUND' };

  const assignment = await prisma.counsellorAssignment.upsert({
    where: { studentMemberId_counsellorMemberId: { studentMemberId, counsellorMemberId } },
    create: { studentMemberId, counsellorMemberId, organizationId: orgId, assignedById },
    update: { assignedById, assignedAt: new Date() },
    include: {
      studentMember: { include: { user: { select: { id: true, name: true } } } },
      counsellorMember: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return assignment;
}

export async function removeStudentAssignment(orgId: number, studentMemberId: number, counsellorMemberId: number) {
  const assignment = await prisma.counsellorAssignment.findFirst({
    where: { studentMemberId, counsellorMemberId, organizationId: orgId },
  });
  if (!assignment) throw { status: 404, message: 'Assignment not found', code: 'NOT_FOUND' };
  await prisma.counsellorAssignment.delete({ where: { id: assignment.id } });
}

export async function getOrgCounsellorAssignments(orgId: number) {
  return prisma.counsellorAssignment.findMany({
    where: { organizationId: orgId },
    include: {
      studentMember: { include: { user: { select: { id: true, name: true, email: true } } } },
      counsellorMember: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}

export async function addMember(
  orgId: number,
  userId: number,
  role: 'STUDENT' | 'EMPLOYEE' | 'TEACHER' | 'HR' | 'ORG_ADMIN',
  memberClass?: string,
  department?: string,
) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw { status: 404, message: 'Organization not found', code: 'ORG_NOT_FOUND' };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw { status: 404, message: 'User not found', code: 'USER_NOT_FOUND' };
  }

  const existing = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (existing) {
    throw { status: 409, message: 'User is already a member of this organization', code: 'ALREADY_MEMBER' };
  }

  const member = await prisma.organizationMember.create({
    data: {
      userId,
      organizationId: orgId,
      role,
      class: memberClass,
      department,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, avatar: true },
      },
    },
  });

  return member;
}

export async function updateMemberRole(
  memberId: number,
  role: 'STUDENT' | 'EMPLOYEE' | 'TEACHER' | 'HR' | 'ORG_ADMIN',
) {
  const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!member) {
    throw { status: 404, message: 'Member not found', code: 'MEMBER_NOT_FOUND' };
  }

  const updated = await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return updated;
}

export async function removeMember(memberId: number) {
  const member = await prisma.organizationMember.findUnique({ where: { id: memberId } });
  if (!member) {
    throw { status: 404, message: 'Member not found', code: 'MEMBER_NOT_FOUND' };
  }

  await prisma.organizationMember.delete({ where: { id: memberId } });
}

export async function allocateCredits(orgId: number, amount: number) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw { status: 404, message: 'Organization not found', code: 'ORG_NOT_FOUND' };
  }

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: { creditBalance: { increment: amount } },
    select: { id: true, name: true, creditBalance: true },
  });

  return updated;
}

export async function allocateMemberCredits(orgId: number, memberId: number, amount: number) {
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { creditBalance: true } });
  if (!org) throw { status: 404, message: 'Organization not found', code: 'ORG_NOT_FOUND' };
  if (org.creditBalance < amount) throw { status: 400, message: 'Insufficient organization credits', code: 'INSUFFICIENT_CREDITS' };

  const [member, updatedOrg] = await prisma.$transaction([
    prisma.organizationMember.update({
      where: { id: memberId },
      data: { creditBalance: { increment: amount } },
      select: { id: true, creditBalance: true, user: { select: { name: true } } },
    }),
    prisma.organization.update({
      where: { id: orgId },
      data: { creditBalance: { decrement: amount } },
      select: { id: true, creditBalance: true },
    }),
  ]);

  return { member, organization: updatedOrg };
}

export async function registerOrganization(data: {
  name: string;
  type: 'SCHOOL' | 'CORPORATE';
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  principalName: string;
  principalEmail: string;
  principalPassword: string;
}) {
  const existingUser = await prisma.user.findUnique({ where: { email: data.principalEmail } });
  if (existingUser) throw { status: 409, message: 'Email already registered', code: 'EMAIL_EXISTS' };

  const code = await uniqueCode(data.name);
  const hashedPassword = await bcrypt.hash(data.principalPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: data.name,
        type: data.type,
        code,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.city ? `${data.address || ''}, ${data.city}`.trim().replace(/^,\s*/, '') : data.address,
      },
    });

    const user = await tx.user.create({
      data: { name: data.principalName, email: data.principalEmail, password: hashedPassword },
    });

    await tx.organizationMember.create({
      data: { userId: user.id, organizationId: org.id, role: 'ORG_ADMIN' },
    });

    return { org, user };
  });

  return { orgCode: code, orgId: result.org.id, orgName: result.org.name, email: data.principalEmail };
}

const VALID_MEMBER_ROLES = ['STUDENT', 'TEACHER', 'COUNSELLOR', 'ORG_ADMIN', 'HR', 'EMPLOYEE'] as const;

export async function bulkAddMembers(orgId: number, filePath: string, uploadedBy: number) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) throw { status: 404, message: 'Organization not found', code: 'ORG_NOT_FOUND' };

  const rows: Array<{ name: string; email: string; phone?: string; role?: string; class?: string; section?: string }> = [];
  const errors: Array<{ row: number; email?: string; error: string }> = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: any) => {
        rows.push({
          name: row.name?.trim(),
          email: row.email?.trim()?.toLowerCase(),
          phone: row.phone?.trim() || undefined,
          role: row.role?.trim()?.toUpperCase() || 'STUDENT',
          class: row.class?.trim() || undefined,
          section: row.section?.trim() || undefined,
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  let successCount = 0;
  const defaultPassword = await bcrypt.hash('Welcome@123', 10);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    if (!row.name || !row.email) {
      errors.push({ row: rowNum, email: row.email, error: 'Name and email are required' });
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ row: rowNum, email: row.email, error: 'Invalid email format' });
      continue;
    }
    const memberRole = VALID_MEMBER_ROLES.includes(row.role as any) ? row.role : 'STUDENT';
    const memberClass = row.section ? `${row.class || ''} ${row.section}`.trim() : row.class;

    try {
      let user = await prisma.user.findUnique({ where: { email: row.email } });
      if (!user) {
        user = await prisma.user.create({
          data: { name: row.name, email: row.email, phone: row.phone, password: defaultPassword },
        });
      }

      const existingMember = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
      });

      if (existingMember) {
        await prisma.organizationMember.update({
          where: { id: existingMember.id },
          data: { role: memberRole as any, class: memberClass },
        });
      } else {
        await prisma.organizationMember.create({
          data: { userId: user.id, organizationId: orgId, role: memberRole as any, class: memberClass },
        });
      }
      successCount++;
    } catch {
      errors.push({ row: rowNum, email: row.email, error: 'Failed to add member' });
    }
  }

  try { fs.unlinkSync(filePath); } catch {}

  const status = errors.length === 0 ? 'completed' : successCount === 0 ? 'failed' : 'partial';

  const upload = await prisma.bulkUpload.create({
    data: {
      filename: filePath.split('/').pop() || 'unknown.csv',
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
      status,
      errors: errors.length > 0 ? errors : undefined,
      uploadedBy,
      organizationId: orgId,
    },
  });

  return {
    totalRows: upload.totalRows,
    successCount: upload.successCount,
    errorCount: upload.errorCount,
    status: upload.status,
    errors: errors.length > 0 ? errors : [],
  };
}

export async function getOrgBulkHistory(orgId: number, limit: number) {
  const data = await prisma.bulkUpload.findMany({
    where: { organizationId: orgId },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
  return data;
}

export async function getUserCredits(userId: number, orgId?: number) {
  // If orgId specified, get credits for that org membership
  if (orgId) {
    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      select: {
        id: true,
        creditBalance: true,
        organization: { select: { id: true, name: true, creditBalance: true } },
      },
    });

    if (!member) {
      throw { status: 404, message: 'Membership not found', code: 'MEMBERSHIP_NOT_FOUND' };
    }

    return member;
  }

  // Otherwise, get all org memberships with credit balances
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    select: {
      id: true,
      creditBalance: true,
      role: true,
      organization: { select: { id: true, name: true, type: true } },
    },
  });

  return memberships;
}

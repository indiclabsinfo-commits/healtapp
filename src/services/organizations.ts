import prisma from '../utils/prisma';

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

export async function getOrgMembers(orgId: number, page: number, limit: number) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw { status: 404, message: 'Organization not found', code: 'ORG_NOT_FOUND' };
  }

  const skip = (page - 1) * limit;

  const [members, total] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      skip,
      take: limit,
      orderBy: { joinedAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatar: true, status: true },
        },
      },
    }),
    prisma.organizationMember.count({ where: { organizationId: orgId } }),
  ]);

  return { members, total };
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

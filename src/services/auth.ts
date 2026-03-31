import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { generateTokens, signResetToken, verifyResetToken } from '../utils/jwt';
import { sendResetEmail } from '../utils/email';

export async function registerUser(name: string, email: string, password: string, orgCode?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw { status: 409, message: 'Email already registered', code: 'EMAIL_EXISTS' };
  }

  // If orgCode provided, validate that the org exists and is active
  let organization: { id: number; type: string; name: string } | null = null;
  if (orgCode) {
    const org = await prisma.organization.findUnique({
      where: { code: orgCode },
      select: { id: true, type: true, name: true, status: true },
    });
    if (!org || org.status === 'INACTIVE') {
      throw { status: 404, message: 'Invalid organization code', code: 'ORG_NOT_FOUND' };
    }
    organization = org;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });

  // If org found, create membership with default role based on org type
  let membership = null;
  if (organization) {
    const defaultRole = organization.type === 'SCHOOL' ? 'STUDENT' : 'EMPLOYEE';
    membership = await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: defaultRole as any,
      },
      include: {
        organization: { select: { id: true, name: true, type: true } },
      },
    });
  }

  const tokens = generateTokens({ userId: user.id, role: user.role });
  return {
    user,
    ...(membership ? { organization: membership.organization, memberRole: membership.role } : {}),
    ...tokens,
  };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw { status: 401, message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' };
  }

  if (user.status === 'INACTIVE') {
    throw { status: 403, message: 'Account is deactivated', code: 'ACCOUNT_INACTIVE' };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw { status: 401, message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' };
  }

  // Fetch org memberships
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      role: true,
      class: true,
      department: true,
      creditBalance: true,
      organization: { select: { id: true, name: true, type: true, logo: true } },
    },
  });

  const tokens = generateTokens({ userId: user.id, role: user.role });
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, organizations: memberships, ...tokens };
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyResetToken(refreshToken);
  // Re-verify it's a refresh token by checking the user exists
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw { status: 401, message: 'Invalid refresh token', code: 'TOKEN_INVALID' };
  }

  const tokens = generateTokens({ userId: user.id, role: user.role });
  return tokens;
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration
  if (!user) return;

  const resetToken = signResetToken(user.id);
  await sendResetEmail(email, resetToken);
}

export async function resetPassword(token: string, newPassword: string) {
  let payload;
  try {
    payload = verifyResetToken(token);
  } catch {
    throw { status: 400, message: 'Invalid or expired reset token', code: 'TOKEN_INVALID' };
  }

  if (payload.purpose !== 'reset') {
    throw { status: 400, message: 'Invalid reset token', code: 'TOKEN_INVALID' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: payload.userId },
    data: { password: hashedPassword },
  });
}

export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true, avatar: true,
      gender: true, age: true, role: true, status: true, createdAt: true,
      memberships: {
        select: {
          id: true,
          role: true,
          class: true,
          department: true,
          creditBalance: true,
          joinedAt: true,
          organization: { select: { id: true, name: true, type: true, logo: true } },
        },
      },
    },
  });

  if (!user) {
    throw { status: 404, message: 'User not found', code: 'NOT_FOUND' };
  }

  return user;
}

export async function updateProfile(userId: number, data: {
  name?: string; phone?: string; avatar?: string; gender?: string; age?: number;
}) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true, name: true, email: true, phone: true, avatar: true,
      gender: true, age: true, role: true, status: true, createdAt: true,
    },
  });

  return user;
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw { status: 404, message: 'User not found', code: 'NOT_FOUND' };
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    throw { status: 400, message: 'Current password is incorrect', code: 'WRONG_PASSWORD' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

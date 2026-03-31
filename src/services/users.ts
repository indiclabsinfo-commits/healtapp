import bcrypt from 'bcryptjs';
import fs from 'fs';
import csv from 'csv-parser';
import prisma from '../utils/prisma';

const USER_SELECT = {
  id: true, name: true, email: true, phone: true, avatar: true,
  gender: true, age: true, role: true, status: true, createdAt: true, updatedAt: true,
};

export async function listUsers(
  page: number, limit: number, search?: string, status?: string
) {
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  if (status && (status === 'ACTIVE' || status === 'INACTIVE')) {
    where.status = status;
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, pagination: { page, limit, total } };
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...USER_SELECT,
      assessments: {
        include: {
          questionnaire: { select: { title: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) {
    throw { status: 404, message: 'User not found', code: 'NOT_FOUND' };
  }

  return user;
}

export async function updateUser(id: number, data: {
  name?: string; email?: string; role?: string; status?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'User not found', code: 'NOT_FOUND' };
  }

  if (data.email && data.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailTaken) {
      throw { status: 409, message: 'Email already in use', code: 'EMAIL_EXISTS' };
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: data as any,
    select: USER_SELECT,
  });

  return user;
}

export async function toggleUserStatus(id: number, status: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'User not found', code: 'NOT_FOUND' };
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: status as any },
    select: USER_SELECT,
  });

  return user;
}

export async function bulkRegisterFromCSV(filePath: string, uploadedBy: number) {
  const rows: Array<{ name: string; email: string; phone?: string }> = [];
  const errors: Array<{ row: number; email?: string; error: string }> = [];

  // Parse CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: any) => {
        rows.push({
          name: row.name?.trim(),
          email: row.email?.trim(),
          phone: row.phone?.trim() || undefined,
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  let successCount = 0;
  const defaultPassword = await bcrypt.hash('User@123', 10);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for header row + 1-indexed

    if (!row.name || !row.email) {
      errors.push({ row: rowNum, email: row.email, error: 'Name and email are required' });
      continue;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ row: rowNum, email: row.email, error: 'Invalid email format' });
      continue;
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email: row.email } });
      if (existing) {
        errors.push({ row: rowNum, email: row.email, error: 'Email already registered' });
        continue;
      }

      await prisma.user.create({
        data: {
          name: row.name,
          email: row.email,
          phone: row.phone,
          password: defaultPassword,
        },
      });
      successCount++;
    } catch (err: any) {
      errors.push({ row: rowNum, email: row.email, error: 'Failed to create user' });
    }
  }

  // Record upload history
  const upload = await prisma.bulkUpload.create({
    data: {
      filename: filePath.split('/').pop() || 'unknown.csv',
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
      status: errors.length === 0 ? 'completed' : successCount === 0 ? 'failed' : 'partial',
      errors: errors.length > 0 ? errors : undefined,
      uploadedBy,
    },
  });

  // Clean up uploaded file
  try { fs.unlinkSync(filePath); } catch {}

  return upload;
}

export async function getBulkHistory(page: number, limit: number) {
  const [data, total] = await Promise.all([
    prisma.bulkUpload.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bulkUpload.count(),
  ]);

  return { data, pagination: { page, limit, total } };
}

export function getCSVTemplate(): Buffer {
  return Buffer.from('name,email,phone\n');
}

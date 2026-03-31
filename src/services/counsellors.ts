import prisma from '../utils/prisma';

export async function listCounsellors(
  page: number, limit: number, search?: string, tag?: string
) {
  const where: any = { status: 'ACTIVE' };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { specialization: { contains: search } },
    ];
  }

  if (tag) {
    where.tags = { some: { name: tag } };
  }

  const [data, total] = await Promise.all([
    prisma.counsellor.findMany({
      where,
      include: { tags: { select: { id: true, name: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.counsellor.count({ where }),
  ]);

  return { data, pagination: { page, limit, total } };
}

export async function getCounsellorById(id: number) {
  const counsellor = await prisma.counsellor.findUnique({
    where: { id },
    include: { tags: { select: { id: true, name: true } } },
  });

  if (!counsellor) {
    throw { status: 404, message: 'Counsellor not found', code: 'NOT_FOUND' };
  }

  return counsellor;
}

export async function createCounsellor(data: {
  name: string; specialization: string; qualifications: string;
  experience: number; bio: string; tags?: string[]; rating?: number;
}, photoPath?: string) {
  const counsellor = await prisma.counsellor.create({
    data: {
      name: data.name,
      specialization: data.specialization,
      qualifications: data.qualifications,
      experience: data.experience,
      bio: data.bio,
      rating: data.rating || 0,
      photo: photoPath || null,
      tags: data.tags?.length
        ? { create: data.tags.map((name) => ({ name })) }
        : undefined,
    },
    include: { tags: { select: { id: true, name: true } } },
  });

  return counsellor;
}

export async function updateCounsellor(id: number, data: {
  name?: string; specialization?: string; qualifications?: string;
  experience?: number; bio?: string; tags?: string[]; rating?: number;
}, photoPath?: string) {
  const existing = await prisma.counsellor.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Counsellor not found', code: 'NOT_FOUND' };
  }

  // If tags provided, delete old tags and create new ones
  if (data.tags) {
    await prisma.counsellorTag.deleteMany({ where: { counsellorId: id } });
  }

  const { tags, ...updateData } = data;
  const counsellor = await prisma.counsellor.update({
    where: { id },
    data: {
      ...updateData,
      ...(photoPath && { photo: photoPath }),
      ...(tags && { tags: { create: tags.map((name) => ({ name })) } }),
    },
    include: { tags: { select: { id: true, name: true } } },
  });

  return counsellor;
}

export async function deleteCounsellor(id: number) {
  const existing = await prisma.counsellor.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Counsellor not found', code: 'NOT_FOUND' };
  }

  await prisma.counsellor.update({
    where: { id },
    data: { status: 'INACTIVE' },
  });
}

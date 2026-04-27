import prisma from '../utils/prisma';

export async function createLevel(data: { name: string; order: number; categoryId: number }) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) {
    throw { status: 404, message: 'Category not found', code: 'NOT_FOUND' };
  }

  // Order uniqueness within category
  const orderDup = await prisma.level.findUnique({
    where: { categoryId_order: { categoryId: data.categoryId, order: data.order } },
  });
  if (orderDup) {
    throw { status: 409, message: 'A level with this order already exists in this category', code: 'DUPLICATE_ORDER' };
  }

  // Case-insensitive name uniqueness within category
  const nameDup = await prisma.level.findFirst({
    where: {
      categoryId: data.categoryId,
      name: { equals: data.name.trim(), mode: 'insensitive' },
    },
  });
  if (nameDup) {
    throw { status: 409, message: 'A level with this name already exists in this category', code: 'DUPLICATE_NAME' };
  }

  return prisma.level.create({
    data: { ...data, name: data.name.trim() },
    include: { _count: { select: { questions: true } } },
  });
}

export async function updateLevel(id: number, data: { name?: string; order?: number }) {
  const existing = await prisma.level.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Level not found', code: 'NOT_FOUND' };
  }

  if (data.order !== undefined && data.order !== existing.order) {
    const duplicate = await prisma.level.findUnique({
      where: { categoryId_order: { categoryId: existing.categoryId, order: data.order } },
    });
    if (duplicate) {
      throw { status: 409, message: 'A level with this order already exists in this category', code: 'DUPLICATE_ORDER' };
    }
  }

  return prisma.level.update({
    where: { id },
    data,
    include: { _count: { select: { questions: true } } },
  });
}

export async function deleteLevel(id: number) {
  const existing = await prisma.level.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Level not found', code: 'NOT_FOUND' };
  }

  await prisma.level.delete({ where: { id } });
}

export async function getQuestionsByLevel(levelId: number) {
  const level = await prisma.level.findUnique({ where: { id: levelId } });
  if (!level) {
    throw { status: 404, message: 'Level not found', code: 'NOT_FOUND' };
  }

  return prisma.question.findMany({
    where: { levelId },
    orderBy: { id: 'asc' },
  });
}

import prisma from '../utils/prisma';

export async function listCategories() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { levels: true } },
      levels: {
        select: {
          id: true,
          name: true,
          order: true,
          _count: { select: { questions: true } },
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return categories;
}

export async function createCategory(data: { name: string; description?: string }) {
  // Case-insensitive uniqueness — "Resilience" and "resilience" should NOT both succeed
  const existing = await prisma.category.findFirst({
    where: { name: { equals: data.name.trim(), mode: 'insensitive' } },
  });
  if (existing) {
    throw { status: 409, message: 'Category name already exists', code: 'DUPLICATE_NAME' };
  }

  return prisma.category.create({ data: { ...data, name: data.name.trim() } });
}

export async function updateCategory(id: number, data: { name?: string; description?: string }) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Category not found', code: 'NOT_FOUND' };
  }

  if (data.name && data.name !== existing.name) {
    const nameTaken = await prisma.category.findUnique({ where: { name: data.name } });
    if (nameTaken) {
      throw { status: 409, message: 'Category name already exists', code: 'DUPLICATE_NAME' };
    }
  }

  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: number) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw { status: 404, message: 'Category not found', code: 'NOT_FOUND' };
  }

  await prisma.category.delete({ where: { id } });
}

export async function getLevelsByCategory(categoryId: number) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw { status: 404, message: 'Category not found', code: 'NOT_FOUND' };
  }

  return prisma.level.findMany({
    where: { categoryId },
    include: { _count: { select: { questions: true } } },
    orderBy: { order: 'asc' },
  });
}

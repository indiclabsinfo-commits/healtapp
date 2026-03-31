import prisma from '../utils/prisma';

export async function getSlots(counsellorId: number) {
  const counsellor = await prisma.counsellor.findUnique({ where: { id: counsellorId } });
  if (!counsellor) {
    throw { status: 404, message: 'Counsellor not found', code: 'NOT_FOUND' };
  }

  return prisma.consultationSlot.findMany({
    where: { counsellorId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

export async function setSlots(counsellorId: number, slots: {
  dayOfWeek: number; startTime: string; endTime: string; duration: number;
}[]) {
  const counsellor = await prisma.counsellor.findUnique({ where: { id: counsellorId } });
  if (!counsellor) {
    throw { status: 404, message: 'Counsellor not found', code: 'NOT_FOUND' };
  }

  // Delete existing slots then create new ones in a transaction
  await prisma.$transaction([
    prisma.consultationSlot.deleteMany({ where: { counsellorId } }),
    ...slots.map((slot) =>
      prisma.consultationSlot.create({
        data: {
          counsellorId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration,
        },
      })
    ),
  ]);

  return prisma.consultationSlot.findMany({
    where: { counsellorId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

export async function getAvailability(counsellorId: number, date: string) {
  const counsellor = await prisma.counsellor.findUnique({ where: { id: counsellorId } });
  if (!counsellor) {
    throw { status: 404, message: 'Counsellor not found', code: 'NOT_FOUND' };
  }

  // Get day of week for the given date (0=Mon ... 6=Sun as stored in schema)
  const dateObj = new Date(date + 'T00:00:00');
  // JS getDay(): 0=Sun, 1=Mon ... 6=Sat -> convert to our schema: 0=Mon, 6=Sun
  const jsDay = dateObj.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

  // Get all available slots for this day of week
  const slots = await prisma.consultationSlot.findMany({
    where: {
      counsellorId,
      dayOfWeek,
      isAvailable: true,
    },
    orderBy: { startTime: 'asc' },
  });

  // Get existing booked consultations for this date
  const startOfDay = new Date(date + 'T00:00:00');
  const endOfDay = new Date(date + 'T23:59:59');

  const bookedConsultations = await prisma.consultation.findMany({
    where: {
      counsellorId,
      date: { gte: startOfDay, lte: endOfDay },
      status: 'BOOKED',
    },
    select: { time: true },
  });

  const bookedTimes = new Set(bookedConsultations.map((c) => c.time));

  // Filter out slots that are already booked
  const availableSlots = slots.filter((slot) => !bookedTimes.has(slot.startTime));

  return availableSlots.map((slot) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    duration: slot.duration,
  }));
}

export async function bookConsultation(userId: number, orgId: number, data: {
  counsellorId: number; date: string; time: string; type?: string;
}) {
  // 1. Check counsellor exists
  const counsellor = await prisma.counsellor.findUnique({ where: { id: data.counsellorId } });
  if (!counsellor || counsellor.status === 'INACTIVE') {
    throw { status: 404, message: 'Counsellor not found or inactive', code: 'NOT_FOUND' };
  }

  // 2. Check slot availability for that date/time
  const dateObj = new Date(data.date + 'T00:00:00');
  const jsDay = dateObj.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

  const slot = await prisma.consultationSlot.findFirst({
    where: {
      counsellorId: data.counsellorId,
      dayOfWeek,
      startTime: data.time,
      isAvailable: true,
    },
  });

  if (!slot) {
    throw { status: 400, message: 'No available slot at this time', code: 'SLOT_UNAVAILABLE' };
  }

  // Check for existing booking at this date/time
  const startOfDay = new Date(data.date + 'T00:00:00');
  const endOfDay = new Date(data.date + 'T23:59:59');

  const existing = await prisma.consultation.findFirst({
    where: {
      counsellorId: data.counsellorId,
      date: { gte: startOfDay, lte: endOfDay },
      time: data.time,
      status: 'BOOKED',
    },
  });

  if (existing) {
    throw { status: 409, message: 'This slot is already booked', code: 'ALREADY_BOOKED' };
  }

  // 3. Check user has credits
  const membership = await prisma.organizationMember.findFirst({
    where: { userId, organizationId: orgId },
  });

  if (!membership || membership.creditBalance < 1) {
    throw { status: 400, message: 'Insufficient credits. Please contact your organization admin.', code: 'NO_CREDITS' };
  }

  // 4. Deduct 1 credit and create consultation in a transaction
  const [_, consultation] = await prisma.$transaction([
    prisma.organizationMember.update({
      where: { id: membership.id },
      data: { creditBalance: { decrement: 1 } },
    }),
    prisma.consultation.create({
      data: {
        userId,
        counsellorId: data.counsellorId,
        organizationId: orgId,
        date: new Date(data.date + 'T00:00:00'),
        time: data.time,
        duration: slot.duration,
        type: data.type || 'IN_PERSON',
        status: 'BOOKED',
        creditUsed: 1,
      },
      include: {
        counsellor: { select: { id: true, name: true, specialization: true, photo: true } },
      },
    }),
  ]);

  return consultation;
}

export async function getMyConsultations(userId: number, page: number, limit: number) {
  const where = { userId };

  const [data, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      include: {
        counsellor: { select: { id: true, name: true, specialization: true, photo: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.consultation.count({ where }),
  ]);

  return { data, pagination: { page, limit, total } };
}

export async function getCounsellorConsultations(counsellorId: number, page: number, limit: number) {
  const where = { counsellorId };

  const [data, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.consultation.count({ where }),
  ]);

  return { data, pagination: { page, limit, total } };
}

export async function getConsultationById(id: number) {
  const consultation = await prisma.consultation.findUnique({
    where: { id },
    include: {
      counsellor: { select: { id: true, name: true, specialization: true, photo: true } },
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  if (!consultation) {
    throw { status: 404, message: 'Consultation not found', code: 'NOT_FOUND' };
  }

  return consultation;
}

export async function updateStatus(consultationId: number, status: string) {
  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!consultation) {
    throw { status: 404, message: 'Consultation not found', code: 'NOT_FOUND' };
  }

  // If cancelling, refund 1 credit
  if (status === 'CANCELLED' && consultation.status === 'BOOKED') {
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: consultation.userId, organizationId: consultation.organizationId },
    });

    if (membership) {
      await prisma.organizationMember.update({
        where: { id: membership.id },
        data: { creditBalance: { increment: consultation.creditUsed } },
      });
    }
  }

  return prisma.consultation.update({
    where: { id: consultationId },
    data: { status: status as any },
    include: {
      counsellor: { select: { id: true, name: true, specialization: true, photo: true } },
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });
}

export async function updateNotes(consultationId: number, notes?: string, summary?: string) {
  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });
  if (!consultation) {
    throw { status: 404, message: 'Consultation not found', code: 'NOT_FOUND' };
  }

  const updateData: any = {};
  if (notes !== undefined) updateData.notes = notes;
  if (summary !== undefined) updateData.summary = summary;

  return prisma.consultation.update({
    where: { id: consultationId },
    data: updateData,
    include: {
      counsellor: { select: { id: true, name: true, specialization: true, photo: true } },
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });
}

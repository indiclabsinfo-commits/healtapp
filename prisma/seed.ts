import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data (order matters for foreign keys)
  await prisma.assignment.deleteMany();
  await prisma.behaviorLog.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.consultationSlot.deleteMany();
  await prisma.breathingHistory.deleteMany();
  await prisma.breathingFavourite.deleteMany();
  await prisma.breathingExercise.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.theoryProgress.deleteMany();
  await prisma.moodLog.deleteMany();
  await prisma.bulkUpload.deleteMany();
  await prisma.questionnaire.deleteMany();
  await prisma.question.deleteMany();
  await prisma.level.deleteMany();
  await prisma.category.deleteMany();
  await prisma.counsellorTag.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.counsellor.deleteMany();
  await prisma.theorySession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Admin
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@mindcare.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('Created admin:', admin.email);

  // 2. Create 5 Users
  const userPassword = await bcrypt.hash('User@123', 10);
  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Sarah Johnson', email: 'user@mindcare.com', password: userPassword } }),
    prisma.user.create({ data: { name: 'Rahul Patel', email: 'rahul@mindcare.com', password: userPassword } }),
    prisma.user.create({ data: { name: 'Anita Desai', email: 'anita@mindcare.com', password: userPassword } }),
    prisma.user.create({ data: { name: 'Vikram Singh', email: 'vikram@mindcare.com', password: userPassword } }),
    prisma.user.create({ data: { name: 'Priya Nair', email: 'priya@mindcare.com', password: userPassword } }),
  ]);
  console.log(`Created ${users.length} users`);

  // 3. Create 3 Counsellors with Tags
  const counsellor1 = await prisma.counsellor.create({
    data: {
      name: 'Dr. Priya Sharma',
      specialization: 'Clinical Psychologist',
      qualifications: 'PhD in Clinical Psychology from NIMHANS\nMPhil in Clinical Psychology\nRCI Licensed',
      experience: 8,
      bio: 'Dr. Priya Sharma is a seasoned clinical psychologist with expertise in anxiety disorders, depression, and trauma-focused therapy. She uses evidence-based approaches including CBT and EMDR.',
      rating: 4.9,
      status: 'ACTIVE',
      tags: {
        create: [
          { name: 'Anxiety' },
          { name: 'Depression' },
          { name: 'CBT' },
          { name: 'Trauma' },
        ],
      },
    },
  });

  const counsellor2 = await prisma.counsellor.create({
    data: {
      name: 'Dr. Arjun Mehta',
      specialization: 'Counselling Psychologist',
      qualifications: 'MA in Counselling Psychology\nCertified CBT Practitioner\nMember of IPS',
      experience: 5,
      bio: 'Dr. Arjun Mehta specializes in relationship counselling, stress management, and career-related mental health concerns. His warm, empathetic approach helps clients feel understood.',
      rating: 4.8,
      status: 'ACTIVE',
      tags: {
        create: [
          { name: 'Stress' },
          { name: 'Relationships' },
          { name: 'Career' },
          { name: 'Self-esteem' },
        ],
      },
    },
  });

  const counsellor3 = await prisma.counsellor.create({
    data: {
      name: 'Dr. Neha Gupta',
      specialization: 'Behavioral Therapist',
      qualifications: 'PhD in Behavioral Science\nBoard Certified Behavior Analyst\nSpecialist in DBT',
      experience: 10,
      bio: 'Dr. Neha Gupta is a behavioral therapy expert with a decade of experience in treating anxiety, OCD, and emotional regulation difficulties. She combines DBT and mindfulness-based approaches.',
      rating: 4.9,
      status: 'ACTIVE',
      tags: {
        create: [
          { name: 'Anxiety' },
          { name: 'OCD' },
          { name: 'DBT' },
          { name: 'Mindfulness' },
        ],
      },
    },
  });
  console.log('Created 3 counsellors');

  // 4. Create 2 Categories with Levels and Questions
  const anxietyCategory = await prisma.category.create({
    data: {
      name: 'Anxiety',
      description: 'Assessments related to anxiety levels, triggers, and coping mechanisms.',
      levels: {
        create: [
          {
            name: 'Basic',
            order: 1,
            questions: {
              create: [
                {
                  text: 'How often do you feel anxious or worried?',
                  type: 'MCQ',
                  options: JSON.stringify([
                    { text: 'Rarely', score: 1 },
                    { text: 'Sometimes', score: 2 },
                    { text: 'Often', score: 3 },
                    { text: 'Almost always', score: 4 },
                  ]),
                },
                {
                  text: 'Do you have trouble sleeping due to worry?',
                  type: 'YESNO',
                  options: JSON.stringify([
                    { text: 'Yes', score: 2 },
                    { text: 'No', score: 0 },
                  ]),
                },
                {
                  text: 'Rate your current anxiety level',
                  type: 'SCALE',
                  options: JSON.stringify({ min: 1, max: 10, labels: { 1: 'Low', 5: 'Moderate', 10: 'Severe' } }),
                },
                {
                  text: 'How often do physical symptoms of anxiety affect your daily life?',
                  type: 'MCQ',
                  options: JSON.stringify([
                    { text: 'Never', score: 0 },
                    { text: 'Occasionally', score: 1 },
                    { text: 'Frequently', score: 3 },
                    { text: 'Constantly', score: 4 },
                  ]),
                },
              ],
            },
          },
          {
            name: 'Intermediate',
            order: 2,
            questions: {
              create: [
                {
                  text: 'Do you avoid situations because of anxiety?',
                  type: 'MCQ',
                  options: JSON.stringify([
                    { text: 'Never', score: 0 },
                    { text: 'Rarely', score: 1 },
                    { text: 'Sometimes', score: 2 },
                    { text: 'Frequently', score: 4 },
                  ]),
                },
                {
                  text: 'Have you experienced panic attacks in the last month?',
                  type: 'YESNO',
                  options: JSON.stringify([
                    { text: 'Yes', score: 3 },
                    { text: 'No', score: 0 },
                  ]),
                },
              ],
            },
          },
        ],
      },
    },
  });

  const stressCategory = await prisma.category.create({
    data: {
      name: 'Stress Management',
      description: 'Assessments to evaluate stress levels and management strategies.',
      levels: {
        create: [
          {
            name: 'Basic',
            order: 1,
            questions: {
              create: [
                {
                  text: 'How stressed do you feel on a typical day?',
                  type: 'SCALE',
                  options: JSON.stringify({ min: 1, max: 10, labels: { 1: 'Calm', 5: 'Moderate', 10: 'Overwhelmed' } }),
                },
                {
                  text: 'What is your primary source of stress?',
                  type: 'MCQ',
                  options: JSON.stringify([
                    { text: 'Work/Studies', score: 2 },
                    { text: 'Relationships', score: 2 },
                    { text: 'Financial', score: 3 },
                    { text: 'Health', score: 3 },
                  ]),
                },
                {
                  text: 'Do you have healthy coping mechanisms for stress?',
                  type: 'YESNO',
                  options: JSON.stringify([
                    { text: 'Yes', score: 0 },
                    { text: 'No', score: 3 },
                  ]),
                },
              ],
            },
          },
        ],
      },
    },
  });
  console.log('Created 2 categories with levels and questions');

  // 5. Create 1 Published Questionnaire
  const anxietyLevel = await prisma.level.findFirst({
    where: { categoryId: anxietyCategory.id, order: 1 },
    include: { questions: true },
  });

  if (anxietyLevel) {
    await prisma.questionnaire.create({
      data: {
        title: 'Anxiety Assessment - Basic Level',
        categoryId: anxietyCategory.id,
        levelId: anxietyLevel.id,
        questionIds: anxietyLevel.questions.map((q) => q.id),
        published: true,
      },
    });
    console.log('Created 1 questionnaire');
  }

  // 6. Create 2 Theory Sessions
  await prisma.theorySession.createMany({
    data: [
      {
        title: 'Understanding Anxiety',
        description: 'A comprehensive course on understanding anxiety: its causes, symptoms, types, and evidence-based management strategies.',
        modules: JSON.stringify([
          { id: 1, title: 'What is Anxiety?', content: 'Understanding the basics of anxiety as a natural response.' },
          { id: 2, title: 'Types of Anxiety Disorders', content: 'GAD, Social Anxiety, Panic Disorder, and more.' },
          { id: 3, title: 'Coping Strategies', content: 'Evidence-based techniques for managing anxiety.' },
          { id: 4, title: 'When to Seek Help', content: 'Recognizing when professional help is needed.' },
        ]),
        duration: 45,
        status: 'published',
      },
      {
        title: 'CBT Basics',
        description: 'Introduction to Cognitive Behavioral Therapy: understanding thought patterns, cognitive distortions, and behavioral activation.',
        modules: JSON.stringify([
          { id: 1, title: 'Introduction to CBT', content: 'The foundations of Cognitive Behavioral Therapy.' },
          { id: 2, title: 'Cognitive Distortions', content: 'Common thinking patterns that affect mental health.' },
          { id: 3, title: 'Thought Records', content: 'How to track and challenge negative thoughts.' },
        ]),
        duration: 30,
        status: 'published',
      },
    ],
  });
  console.log('Created 2 theory sessions');

  // 8. Create Breathing Exercises
  await prisma.breathingExercise.createMany({
    data: [
      {
        name: 'Heart Coherence',
        description: 'Balance breathing at 6 breaths per minute. Equal inhale and exhale promotes cardiac coherence and reduces stress.',
        inhaleSeconds: 5,
        holdSeconds: 0,
        exhaleSeconds: 5,
        holdAfterExhale: 0,
        defaultCycles: 6,
        category: 'balance',
      },
      {
        name: 'Square Breathing',
        description: 'Box breathing technique used by Navy SEALs for deep relaxation. Inhale, hold, exhale, and hold in a square pattern.',
        inhaleSeconds: 4,
        holdSeconds: 4,
        exhaleSeconds: 4,
        holdAfterExhale: 4,
        defaultCycles: 4,
        category: 'relaxation',
      },
      {
        name: 'Rectangle Breathing',
        description: 'Calms mental ruminations with an extended exhale pattern. Longer exhale activates the parasympathetic nervous system.',
        inhaleSeconds: 4,
        holdSeconds: 2,
        exhaleSeconds: 6,
        holdAfterExhale: 2,
        defaultCycles: 5,
        category: 'calm',
      },
      {
        name: '4-7-8 Breathing',
        description: 'Dr. Andrew Weil technique for blood pressure reduction and sleep improvement. The extended hold and exhale calm the nervous system.',
        inhaleSeconds: 4,
        holdSeconds: 7,
        exhaleSeconds: 8,
        holdAfterExhale: 0,
        defaultCycles: 4,
        category: 'sleep',
      },
      {
        name: '3-0-3-3 Breathing',
        description: 'Stimulates the parasympathetic nervous system for anxiety relief. Short inhale with hold after exhale pattern.',
        inhaleSeconds: 3,
        holdSeconds: 0,
        exhaleSeconds: 3,
        holdAfterExhale: 3,
        defaultCycles: 6,
        category: 'anxiety',
      },
    ],
  });
  console.log('Created 5 breathing exercises');

  // 9. Create 2 Organizations
  const school = await prisma.organization.create({
    data: {
      name: 'Delhi Public School',
      type: 'SCHOOL',
      code: 'DPS-DEL-2026',
      contactEmail: 'admin@dps.edu.in',
      contactPhone: '+91-11-26531234',
      address: 'Mathura Road, New Delhi 110003',
      creditBalance: 100,
    },
  });

  const corporate = await prisma.organization.create({
    data: {
      name: 'TechCorp India',
      type: 'CORPORATE',
      code: 'TECH-BLR-2026',
      contactEmail: 'hr@techcorp.in',
      contactPhone: '+91-80-41234567',
      address: 'Whitefield, Bangalore 560066',
      creditBalance: 200,
    },
  });
  console.log('Created 2 organizations');

  // 10. Create role-based test accounts
  const password = await bcrypt.hash('Test@123', 10);

  const principal = await prisma.user.create({
    data: { name: 'Dr. Meera Sharma', email: 'principal@dps.edu.in', password, role: 'USER', status: 'ACTIVE' },
  });
  const teacher = await prisma.user.create({
    data: { name: 'Rajesh Kumar', email: 'teacher@dps.edu.in', password, role: 'USER', status: 'ACTIVE' },
  });
  const student1 = await prisma.user.create({
    data: { name: 'Aarav Patel', email: 'student@dps.edu.in', password, role: 'USER', status: 'ACTIVE', age: 16 },
  });
  const student2 = await prisma.user.create({
    data: { name: 'Priya Singh', email: 'student2@dps.edu.in', password, role: 'USER', status: 'ACTIVE', age: 15 },
  });

  const hrUser = await prisma.user.create({
    data: { name: 'Anita Desai', email: 'hr@techcorp.in', password, role: 'USER', status: 'ACTIVE' },
  });
  const employee1 = await prisma.user.create({
    data: { name: 'Vikram Mehta', email: 'employee@techcorp.in', password, role: 'USER', status: 'ACTIVE' },
  });

  const counsellorUser = await prisma.user.create({
    data: { name: 'Dr. Kavita Rao', email: 'counsellor@mindcare.com', password, role: 'USER', status: 'ACTIVE' },
  });

  // 11. Assign org memberships
  await prisma.organizationMember.createMany({
    data: [
      { userId: principal.id, organizationId: school.id, role: 'ORG_ADMIN' },
      { userId: teacher.id, organizationId: school.id, role: 'TEACHER', class: '10-A' },
      { userId: student1.id, organizationId: school.id, role: 'STUDENT', class: '10-A', creditBalance: 5 },
      { userId: student2.id, organizationId: school.id, role: 'STUDENT', class: '10-B', creditBalance: 5 },
      { userId: hrUser.id, organizationId: corporate.id, role: 'HR' },
      { userId: employee1.id, organizationId: corporate.id, role: 'EMPLOYEE', department: 'Engineering', creditBalance: 3 },
    ],
  });
  console.log('Created role-based test accounts + memberships');

  // 12. Add consultation slots for seeded counsellors
  const counsellors = await prisma.counsellor.findMany({ take: 2 });
  if (counsellors.length > 0) {
    const slotData = [];
    for (const c of counsellors) {
      for (let day = 0; day < 5; day++) { // Mon-Fri
        for (let hour = 9; hour < 17; hour++) { // 9am-5pm
          slotData.push({
            counsellorId: c.id,
            dayOfWeek: day,
            startTime: `${String(hour).padStart(2, '0')}:00`,
            endTime: `${String(hour).padStart(2, '0')}:30`,
            duration: 30,
            isAvailable: true,
          });
          slotData.push({
            counsellorId: c.id,
            dayOfWeek: day,
            startTime: `${String(hour).padStart(2, '0')}:30`,
            endTime: `${String(hour + 1).padStart(2, '0')}:00`,
            duration: 30,
            isAvailable: true,
          });
        }
      }
    }
    await prisma.consultationSlot.createMany({ data: slotData });
    console.log(`Created ${slotData.length} consultation slots`);
  }

  // 13. Create Assignments (demo data)
  const questionnaire = await prisma.questionnaire.findFirst({ where: { published: true } });
  const anxietyTheory = await prisma.theorySession.findFirst({ where: { title: 'Understanding Anxiety' } });

  if (questionnaire) {
    await prisma.assignment.create({
      data: {
        organizationId: school.id,
        assignedById: teacher.id,
        type: 'ASSESSMENT',
        questionnaireId: questionnaire.id,
        targetType: 'CLASS',
        targetValue: '10-A',
        title: 'Weekly Anxiety Check',
        description: 'Complete the anxiety assessment to track your weekly progress.',
        deadline: new Date('2026-04-05'),
        mandatory: true,
      },
    });
  }

  if (anxietyTheory) {
    await prisma.assignment.create({
      data: {
        organizationId: school.id,
        assignedById: teacher.id,
        type: 'THEORY',
        theorySessionId: anxietyTheory.id,
        targetType: 'ALL',
        targetValue: null,
        title: 'Understanding Anxiety Course',
        description: 'Go through the Understanding Anxiety theory session at your own pace.',
        deadline: new Date('2026-04-15'),
        mandatory: false,
      },
    });
  }
  console.log('Created 2 assignments');

  // 14. Create Behavior Logs (demo data)
  await prisma.behaviorLog.createMany({
    data: [
      {
        studentId: student1.id,
        teacherId: teacher.id,
        organizationId: school.id,
        date: new Date('2026-03-20'),
        category: 'EMOTIONAL',
        severity: 'MODERATE',
        notes: 'Aarav appeared visibly upset during class today. He was withdrawn and did not participate in group activities. When asked if everything was okay, he shrugged it off but seemed distressed.',
        flagForCounseling: true,
        counselingStatus: 'PENDING',
      },
      {
        studentId: student1.id,
        teacherId: teacher.id,
        organizationId: school.id,
        date: new Date('2026-03-18'),
        category: 'ACADEMIC',
        severity: 'LOW',
        notes: 'Aarav did not submit his homework for the second time this week. He mentioned he forgot but seemed otherwise in good spirits.',
        flagForCounseling: false,
        counselingStatus: 'NONE',
      },
      {
        studentId: student2.id,
        teacherId: teacher.id,
        organizationId: school.id,
        date: new Date('2026-03-19'),
        category: 'SOCIAL',
        severity: 'LOW',
        notes: 'Priya had a minor disagreement with a classmate during recess. The situation was resolved quickly and both students moved on. No further action needed.',
        flagForCounseling: false,
        counselingStatus: 'NONE',
      },
    ],
  });
  console.log('Created 3 behavior logs');

  // 15. Create Consultations (demo data)
  await prisma.consultation.createMany({
    data: [
      {
        userId: student1.id,
        counsellorId: counsellor1.id,
        organizationId: school.id,
        date: new Date('2026-03-28'),
        time: '10:00',
        duration: 30,
        status: 'BOOKED',
        type: 'IN_PERSON',
        creditUsed: 1,
      },
      {
        userId: employee1.id,
        counsellorId: counsellor2.id,
        organizationId: corporate.id,
        date: new Date('2026-03-29'),
        time: '14:00',
        duration: 30,
        status: 'BOOKED',
        type: 'IN_PERSON',
        creditUsed: 1,
      },
    ],
  });
  console.log('Created 2 consultations');

  // 16. Create Mood Logs for student Aarav (last 5 days)
  const now = new Date();
  await prisma.moodLog.createMany({
    data: [
      { userId: student1.id, mood: 3, date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 4) },
      { userId: student1.id, mood: 4, date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3) },
      { userId: student1.id, mood: 2, date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2) },
      { userId: student1.id, mood: 4, date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1) },
      { userId: student1.id, mood: 5, date: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
    ],
  });
  console.log('Created 5 mood logs for student Aarav');

  console.log('\n=== Test Accounts ===');
  console.log('Super Admin:  admin@mindcare.com / Admin@123');
  console.log('Principal:    principal@dps.edu.in / Test@123 (Org: DPS-DEL-2026)');
  console.log('Teacher:      teacher@dps.edu.in / Test@123 (Org: DPS-DEL-2026)');
  console.log('Student:      student@dps.edu.in / Test@123 (Org: DPS-DEL-2026)');
  console.log('HR:           hr@techcorp.in / Test@123 (Org: TECH-BLR-2026)');
  console.log('Employee:     employee@techcorp.in / Test@123 (Org: TECH-BLR-2026)');
  console.log('Counsellor:   counsellor@mindcare.com / Test@123');
  console.log('====================\n');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

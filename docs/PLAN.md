# MindCare v2 — Agent Execution Plan
## B2B2C Pivot: Schools & Corporates

> **Read this file at the start of every session.**
> **Prototype Deadline: April 1, 2026**
> **Full spec: /docs/REVISED_PLAN.md**

---

## CONTEXT FOR ALL AGENTS

MindCare has pivoted from a B2C wellness app to a **B2B2C platform**. The client (Indic Labs) will partner with **schools and corporates** who purchase credit packages. Their students/employees use the platform for free via organization codes.

### The Business Model
```
MindCare (platform) → sells credit packages to → Schools / Corporates
Schools / Corporates → give org codes to → Students / Employees
Students / Employees → use credits to → Book counselling sessions
Teachers → log student behavior → flag for counselling
HR → monitor employee wellness → assign assessments
```

### What We Already Built (v1) — DO NOT REBUILD
- JWT auth (register/login/forgot-password/reset) ✅
- Breathing exercises (5 exercises, animated circle, favourites, history) ✅
- Theory sessions with progress tracking ✅
- Assessment quiz (MCQ/Scale/YesNo + auto-scoring) ✅
- Counsellor profiles with tags ✅
- Questionnaire builder (4-step: categories → levels → questions → build) ✅
- Admin dashboard with real analytics ✅
- User dashboard with mood check-in ✅
- Dark/light mode with full design system ✅
- Rate limiting, Zod validation, error handling ✅
- 138 API tests passing ✅
- Android app (8 screens, compiles clean) ✅

### What We're Adding (v2) — THE NEW WORK
1. Organization management + org codes
2. Role-based access (7 roles)
3. Consultation booking with credits
4. Teacher behavior logging
5. Assignment system
6. Org-scoped analytics

---

## AGENT ASSIGNMENTS

### @backend — Days 1-6

**You own: Schema changes, new APIs, middleware updates.**

#### Day 1: Organization Foundation
```
DO:
1. Add to prisma/schema.prisma:

   enum OrgType { SCHOOL  CORPORATE }

   enum MemberRole { STUDENT  EMPLOYEE  TEACHER  HR  ORG_ADMIN }

   enum CounsellorType { IN_HOUSE  EXTERNAL }

   model Organization {
     id            Int       @id @default(autoincrement())
     name          String
     type          OrgType
     code          String    @unique    // e.g. "DPS-DEL-2026"
     logo          String?
     address       String?   @db.Text
     contactEmail  String?
     contactPhone  String?
     creditBalance Int       @default(0)
     status        Status    @default(ACTIVE)
     createdAt     DateTime  @default(now())
     updatedAt     DateTime  @updatedAt
     members       OrganizationMember[]
     consultations Consultation[]
     behaviorLogs  BehaviorLog[]
     assignments   Assignment[]
   }

   model OrganizationMember {
     id             Int          @id @default(autoincrement())
     userId         Int
     user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
     organizationId Int
     organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
     role           MemberRole   @default(STUDENT)
     class          String?      // for school: "10-A", "12-B"
     department     String?      // for corporate: "Engineering", "HR"
     creditBalance  Int          @default(0)
     joinedAt       DateTime     @default(now())

     @@unique([userId, organizationId])
   }

2. Add organizationId to User model (optional, for quick access)
3. Add CounsellorType to Counsellor model
4. Create API: POST /api/v1/organizations/validate-code { code } → returns { orgId, name, type }
5. Modify POST /api/v1/auth/register to accept orgCode, auto-create OrganizationMember
6. Modify POST /api/v1/auth/login to return org info in response
7. Create CRUD: /api/v1/organizations (Super Admin only)
8. Seed 2 orgs: "Delhi Public School" (code: DPS-DEL-2026) + "TechCorp India" (code: TECH-BLR-2026)

DON'T:
- Break existing auth flow — org code is OPTIONAL for super admins
- Remove any existing endpoints
```

#### Day 2: Roles & Org Membership
```
DO:
1. Create middleware: requireOrgAdmin, requireTeacher, requireOrgMember
2. Create API: GET /api/v1/organizations/:id/members (Org Admin)
3. Create API: POST /api/v1/organizations/:id/members/invite (Org Admin)
4. Create API: PUT /api/v1/organizations/:id/members/:id/role (Org Admin)
5. Modify GET /api/v1/users to scope by org when user is Org Admin
6. Modify GET /api/v1/auth/me to include org membership + role

DON'T:
- Change super admin access — super admins see everything
```

#### Day 3: Credits & Counsellor Availability
```
DO:
1. Add to schema:

   model ConsultationSlot {
     id           Int        @id @default(autoincrement())
     counsellorId Int
     counsellor   Counsellor @relation(fields: [counsellorId], references: [id], onDelete: Cascade)
     dayOfWeek    Int        // 0=Mon, 6=Sun
     startTime    String     // "09:00"
     endTime      String     // "09:30"
     duration     Int        @default(30)  // minutes
     isAvailable  Boolean    @default(true)
   }

2. Create API: GET/POST/PUT/DELETE /api/v1/counsellors/:id/slots (Counsellor manages own)
3. Create API: GET /api/v1/counsellors/:id/availability?date=2026-04-01 (User views)
4. Credit APIs:
   - GET /api/v1/organizations/:id/credits (Org Admin)
   - POST /api/v1/organizations/:id/credits/allocate { userId, amount } (Org Admin)
   - GET /api/v1/credits/my (User — returns their balance)

DON'T:
- Over-complicate slots — simple 30-min blocks, no recurring patterns
```

#### Day 4: Consultation Booking
```
DO:
1. Add to schema:

   enum ConsultationStatus { BOOKED  COMPLETED  CANCELLED  NO_SHOW }

   model Consultation {
     id             Int                @id @default(autoincrement())
     userId         Int
     user           User               @relation(fields: [userId], references: [id])
     counsellorId   Int
     counsellor     Counsellor         @relation(fields: [counsellorId], references: [id])
     organizationId Int
     organization   Organization       @relation(fields: [organizationId], references: [id])
     date           DateTime
     time           String
     duration       Int                @default(30)
     status         ConsultationStatus @default(BOOKED)
     type           String             @default("IN_PERSON")  // or VIDEO
     notes          String?            @db.Text   // counsellor's private notes
     summary        String?            @db.Text   // shareable summary
     creditUsed     Int                @default(1)
     createdAt      DateTime           @default(now())
     updatedAt      DateTime           @updatedAt
   }

2. Booking API:
   - POST /api/v1/consultations/book { counsellorId, date, time } → checks credit → deducts → creates
   - GET /api/v1/consultations/my (User — upcoming + past)
   - GET /api/v1/consultations/counsellor (Counsellor — their schedule)
   - PUT /api/v1/consultations/:id/status { status } (Counsellor — mark complete/cancel)
   - PUT /api/v1/consultations/:id/notes { notes, summary } (Counsellor)
   - GET /api/v1/consultations/:id (detail with notes)

DON'T:
- Implement video call — just store a "joinLink" field for now
- Handle payment — credits are pre-loaded by admin
```

#### Day 5: Teacher Behavior Logging
```
DO:
1. Add to schema:

   enum BehaviorCategory { ACADEMIC  SOCIAL  EMOTIONAL  BEHAVIORAL }
   enum Severity { LOW  MODERATE  HIGH  CRITICAL }
   enum CounselingStatus { NONE  PENDING  SCHEDULED  COMPLETED }

   model BehaviorLog {
     id                Int              @id @default(autoincrement())
     studentId         Int
     student           User             @relation("BehaviorStudent", fields: [studentId], references: [id])
     teacherId         Int
     teacher           User             @relation("BehaviorTeacher", fields: [teacherId], references: [id])
     organizationId    Int
     organization      Organization     @relation(fields: [organizationId], references: [id])
     date              DateTime         @default(now())
     category          BehaviorCategory
     severity          Severity         @default(LOW)
     notes             String           @db.Text
     flagForCounseling Boolean          @default(false)
     counselingStatus  CounselingStatus @default(NONE)
     createdAt         DateTime         @default(now())
   }

2. APIs:
   - POST /api/v1/behavior-logs { studentId, category, severity, notes, flagForCounseling } (Teacher)
   - GET /api/v1/behavior-logs?studentId=X (Teacher/Counsellor — view student's logs)
   - GET /api/v1/behavior-logs/flagged (Counsellor — students flagged for counseling)
   - GET /api/v1/behavior-logs/class?class=10-A (Teacher — class overview)
   - PUT /api/v1/behavior-logs/:id/counseling-status { status } (Counsellor)

DON'T:
- Let students see behavior logs — only teachers, counsellors, org admins
```

#### Day 6: Assignments
```
DO:
1. Add to schema:

   model Assignment {
     id               Int          @id @default(autoincrement())
     organizationId   Int
     organization     Organization @relation(fields: [organizationId], references: [id])
     assignedById     Int
     assignedBy       User         @relation(fields: [assignedById], references: [id])
     type             String       // "ASSESSMENT" or "THEORY"
     questionnaireId  Int?
     theorySessionId  Int?
     targetType       String       // "ALL", "CLASS", "DEPARTMENT", "INDIVIDUAL"
     targetValue      String?      // "10-A" or "Engineering" or userId
     title            String
     description      String?      @db.Text
     deadline         DateTime?
     mandatory        Boolean      @default(false)
     status           Status       @default(ACTIVE)
     createdAt        DateTime     @default(now())
   }

2. APIs:
   - POST /api/v1/assignments (Teacher/HR/Org Admin)
   - GET /api/v1/assignments/my (User — what's assigned to me)
   - GET /api/v1/assignments?orgId=X (Org Admin — all assignments in org)
   - PUT /api/v1/assignments/:id (update/expire)
   - DELETE /api/v1/assignments/:id

DON'T:
- Build notification system yet — just show on dashboard
```

---

### @frontend — Days 1-8

**You own: All page updates, new pages, navigation changes.**

#### Day 1: Org Code Login Flow
```
DO:
1. Create /app/(auth)/org-code/page.tsx
   - Full-screen page: "Enter Your Organization Code"
   - Input field for code
   - "Continue" button → validates via API → stores org info → redirects to /login
   - Error if invalid code

2. Modify /app/(auth)/login/page.tsx
   - Show org name + logo at top if org is selected
   - "Change organization" link back to /org-code

3. Modify /app/(auth)/register/page.tsx
   - Same: show org context
   - Role auto-assigned based on org type

4. Update auth store to include org info

DON'T:
- Remove existing login — org code is a PRE-step, not a replacement
```

#### Day 2-3: Role-Based Navigation
```
DO:
1. Update admin sidebar to show different items per role:
   - Super Admin: Everything
   - Org Admin: Users, Counsellors, Assignments, Credits, Analytics
   - Teacher: Students, Behavior Log, Class Wellness
   - HR: Employees, Assignments, Wellness Reports
   - Counsellor: Schedule, Clients, Flagged Students

2. Update bottom nav for user roles:
   - Student/Employee: Home, Breathe, Book, Profile
   - Teacher: Home, Students, Log, Profile

3. Show credit balance in user dashboard header

DON'T:
- Create separate apps per role — one app, different views
```

#### Day 4: Consultation Booking Page
```
DO:
1. Create /app/(user)/book/page.tsx
   - Browse counsellors (reuse existing counsellor cards)
   - Click counsellor → see available slots (calendar view)
   - Select date → see time slots
   - Click slot → confirm booking → deduct credit
   - Show "Booked!" confirmation

2. Create /app/(user)/consultations/page.tsx
   - "Upcoming" section: date, time, counsellor name, status
   - "Past" section: completed sessions with summary

DON'T:
- Build a full calendar component — simple date picker + time slot list
```

#### Day 5: Teacher Dashboard
```
DO:
1. Create /app/(teacher)/dashboard/page.tsx or use role-based rendering in admin layout
   - Class selector dropdown
   - Student list with mood indicators
   - "Log Behavior" button per student → opens modal

2. Create behavior log modal:
   - Student name (pre-filled)
   - Category dropdown
   - Severity dropdown
   - Notes textarea
   - "Flag for Counseling" checkbox
   - Submit

3. Class wellness overview:
   - Average mood
   - Students flagged count
   - Assessment completion rate

DON'T:
- Over-design — cards + table + modal is enough
```

#### Day 6: Counsellor Dashboard
```
DO:
1. Create /app/(counsellor)/dashboard/page.tsx
   - Today's schedule (list of booked sessions)
   - Flagged students (from teachers)
   - Session notes form (after completing a session)

2. Availability management page:
   - Weekly grid (Mon-Sun)
   - Toggle time slots on/off
   - Save availability

DON'T:
- Build video calling — just show session details
```

#### Day 7-8: Polish + Integration
```
DO:
1. Add assignment cards to student dashboard ("You have 2 pending assessments")
2. Add credit balance display
3. Org Admin: credit management page
4. Role-based routing guards
5. Loading states everywhere
6. Responsive check on all new pages
```

---

### @qa — Days 8-10

**You own: Testing all flows, finding bugs, verifying role access.**

```
Test Accounts to Create:
- super@mindcare.com / Super@123 (Super Admin)
- principal@dps.com / Principal@123 (Org Admin — DPS)
- teacher@dps.com / Teacher@123 (Teacher — DPS)
- student@dps.com / Student@123 (Student — DPS)
- hr@techcorp.com / HR@123 (HR — TechCorp)
- employee@techcorp.com / Employee@123 (Employee — TechCorp)
- counsellor@mindcare.com / Counsellor@123 (Counsellor)

Critical Test Flows:
1. Org code → Register → Login → Dashboard (per role)
2. Student: Browse → Book consultation → Credit deducted
3. Teacher: Select student → Log behavior → Flag → Counsellor sees it
4. Org Admin: View members → Assign assessment → Student sees it
5. Counsellor: View schedule → Complete session → Write notes
6. Credit deduction: Book → balance decreases. No credits → can't book.
7. Role isolation: Student CAN'T access teacher routes. Teacher CAN'T access admin routes.
```

---

### @ui — Ongoing

**You own: Ensuring new pages match the design system.**

```
Rules (same as v1):
- Dark mode primary, light mode secondary
- Glass cards, 16px radius, accent #6FFFE9 dark / #0D9488 light
- Playfair Display headings, DM Sans body
- Follow /app/globals.css variables exactly
- New pages must match existing page aesthetics

New Components Needed:
- OrgCodeInput (large centered input with org logo reveal)
- CreditBadge (shows "3 credits" in header)
- SlotPicker (date selector + time slot grid)
- BehaviorLogCard (student name, category, severity, notes)
- AssignmentCard (title, type tag, deadline, mandatory badge)
```

---

## DAILY SYNC PROTOCOL

At the end of each day:
1. @backend: List new endpoints created + tested
2. @frontend: List pages created + screenshots
3. @qa: List bugs found (Day 8+)
4. Update this file's PROGRESS section below

---

## PROGRESS TRACKER

| Day | Date | Backend | Frontend | Status |
|-----|------|---------|----------|--------|
| 1 | Mar 23 | | | NOT STARTED |
| 2 | Mar 24 | | | |
| 3 | Mar 25 | | | |
| 4 | Mar 26 | | | |
| 5 | Mar 27 | | | |
| 6 | Mar 28 | | | |
| 7 | Mar 29 | | | |
| 8 | Mar 30 | | | |
| 9 | Mar 31 | | | |
| 10 | Apr 1 | | | PROTOTYPE |

---

## QUICK REFERENCE

### Existing File Structure (don't change)
```
/src          — Express backend (routes/controllers/services/middleware/validators)
/app          — Next.js pages: (auth), (user), (admin)
/prisma       — Schema + migrations + seed
/components   — Shared components (sidebar, bottom nav, topbar, theme)
/lib          — API wrappers (axios instances)
/stores       — Zustand auth store
/tests/api    — Vitest tests
/mobile       — React Native/Expo Android app
/deploy       — Oracle Cloud deployment scripts
```

### API Convention (don't change)
```
All routes: /api/v1/{resource}
Success: { success: true, data: {...} }
Error: { success: false, error: "msg", code: "CODE" }
List: { success: true, data: [...], pagination: { page, limit, total } }
Auth: Authorization: Bearer {token}
```

### Current Models (15 — don't modify, only add)
User, Counsellor, CounsellorTag, Category, Level, Question,
Questionnaire, Assessment, TheorySession, TheoryProgress,
MoodLog, BreathingExercise, BreathingFavourite, BreathingHistory, BulkUpload

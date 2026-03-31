# MindCare — Revised Platform Plan
## B2B2C Counselling & Wellness Platform

> **Version:** 2.0 | March 2026
> **Client:** Indic Labs
> **Prototype Deadline:** 1st Week of April 2026 (~10 days)
> **Platforms:** Web App + Android App (same backend)

---

## 1. WHAT CHANGED

### Previous Model (v1) — B2C
```
Individual users sign up → Take assessments → Browse counsellors → Done
```

### New Model (v2) — B2B2C
```
MindCare partners with Schools & Corporates
→ Each org gets a unique code (e.g., DELHI-PUBLIC-2026, INFOSYS-BLR)
→ Students/Employees join using org code
→ They get FREE credits for consultations
→ Teachers log student behavior & flag who needs counseling
→ HR monitors employee wellness trends
→ Counsellors (in-house + external) provide paid sessions via credits
```

---

## 2. COMPLETE USER ROLES

| Role | Who | What They Do |
|---|---|---|
| **Super Admin** | MindCare team | Manage everything — orgs, counsellors, billing, platform |
| **Org Admin** | School Principal / HR Head | Manage their org — invite users, view reports, assign assessments |
| **Teacher** | School teacher | Log student behavior, flag students for counseling, view class wellness |
| **HR Manager** | Corporate HR | View employee wellness trends, assign assessments, manage credits |
| **Student** | School student | Take assessments, breathing exercises, book counseling (free credits) |
| **Employee** | Corporate employee | Same as student but in corporate context |
| **Counsellor** | In-house or External | Manage availability, conduct sessions, write notes |

---

## 3. PLATFORM ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│                   MindCare Platform                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Web App      │  │  Android App │  │  Admin      │ │
│  │  (Students/   │  │  (Students/  │  │  Dashboard  │ │
│  │   Employees/  │  │   Employees) │  │  (Super +   │ │
│  │   Teachers/   │  │              │  │   Org Admin)│ │
│  │   Counsellors)│  │              │  │             │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                  │                 │        │
│         └──────────────────┼─────────────────┘        │
│                            │                          │
│                   ┌────────▼────────┐                 │
│                   │  REST API       │                 │
│                   │  Node.js + MySQL│                 │
│                   └─────────────────┘                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 4. COMPLETE APP FLOW

### 4.1 Onboarding Flow

```
Step 1: User opens app
        ↓
Step 2: Enter Organization Code
        ┌─────────────────────┐
        │  Enter Your Code    │
        │  [DELHI-PUBLIC-2026] │
        │  [Continue →]       │
        └─────────────────────┘
        ↓
Step 3: App validates code → shows org name + logo
        "Delhi Public School — Welcome!"
        ↓
Step 4: Login or Register
        ├── Existing user → Login (email + password)
        └── New user → Register (name, email, password, role auto-assigned)
        ↓
Step 5: Dashboard (based on role)
```

### 4.2 Student / Employee Flow

```
Dashboard
├── Mood Check-in (daily emoji)
├── Quick Actions
│   ├── 📋 Self Assessment (assigned + free)
│   ├── 🌬️ Breathing Exercises
│   ├── 📖 Theory Sessions
│   └── 🗓️ Book Consultation
├── My Consultations (upcoming + past)
├── Credits Balance: "5 free sessions remaining"
└── Notifications

Assessment Flow:
  Assigned assessments (by teacher/HR) → mandatory
  Free assessments → optional
  Results → stored, visible to user + counsellor + teacher/HR

Book Consultation:
  Browse counsellors (in-house first, then external)
  → See availability slots
  → Book slot (deducts 1 credit)
  → Video/In-person session
  → Counsellor writes session notes
  → Follow-up assigned if needed

Breathing Exercises:
  Same as v1 — animated guided exercises
  Usage tracked per user

Theory Sessions:
  Same as v1 — modules with progress tracking
```

### 4.3 Teacher Flow

```
Teacher Dashboard
├── My Classes (assigned classes/sections)
├── Student Directory (all students in their classes)
├── Behavior Log
│   ├── Select Student
│   ├── Log Entry: Date, Category, Notes, Severity
│   ├── Categories: Academic, Social, Emotional, Behavioral
│   └── Flag for Counseling (triggers notification to counsellor + admin)
├── Class Wellness Overview
│   ├── Average mood scores
│   ├── Assessment completion rates
│   └── Students flagged for counseling
└── Consultation Requests (view status of flagged students)

Behavior Log Entry Example:
┌──────────────────────────────────────────┐
│  Student: Rahul Patel                     │
│  Date: March 22, 2026                     │
│  Category: [Emotional ▾]                  │
│  Severity: [Moderate ▾]                   │
│  Notes: "Withdrawn in class, not          │
│          participating in group work.      │
│          Second time this week."           │
│  [  ] Flag for Counseling                 │
│  [Submit Log]                             │
└──────────────────────────────────────────┘
```

### 4.4 HR Manager Flow

```
HR Dashboard
├── Employee Wellness Overview
│   ├── Department-wise assessment scores
│   ├── Consultation utilization rates
│   └── Trending issues (anonymous/aggregated)
├── Assign Assessments
│   ├── Select department or all employees
│   ├── Choose assessment
│   └── Set deadline
├── Credit Management
│   ├── Total credits allocated
│   ├── Credits used vs remaining
│   └── Request more credits from MindCare
└── Reports (downloadable)
```

### 4.5 Counsellor Flow

```
Counsellor Dashboard
├── Today's Schedule (upcoming sessions)
├── My Clients
│   ├── View client history (assessments, behavior logs)
│   ├── Session notes
│   └── Treatment plan
├── Availability Management
│   ├── Set weekly schedule (Mon 9-12, Tue 2-5, etc.)
│   ├── Block dates
│   └── Session duration (30min / 60min)
├── Flagged Students (from teachers)
│   ├── Review behavior logs
│   ├── Accept/schedule consultation
│   └── Priority queue
└── Session Notes
    ├── Per-session notes (private)
    ├── Summary visible to teacher/HR (with consent)
    └── Follow-up actions
```

### 4.6 Org Admin Flow

```
Org Admin Dashboard
├── Organization Profile (name, logo, code)
├── User Management
│   ├── Invite users (email or bulk CSV)
│   ├── Assign roles (student/teacher/employee/HR)
│   ├── Assign classes/departments
│   └── Deactivate users
├── Counsellor Assignment
│   ├── Assign in-house counsellors to org
│   └── Enable external counsellor access
├── Credit Management
│   ├── View credit balance
│   ├── Allocate credits per user/department
│   └── Purchase more credits
├── Reports & Analytics
│   ├── Overall wellness score
│   ├── Assessment completion rates
│   ├── Consultation utilization
│   ├── Behavior flag trends (school only)
│   └── Export CSV/PDF
└── Settings
    ├── Org code
    ├── Branding (logo, colors)
    └── Notification preferences
```

### 4.7 Super Admin Flow (MindCare Team)

```
Super Admin Dashboard
├── Organization Management
│   ├── Create/edit organizations
│   ├── Generate org codes
│   ├── Set org type (school/corporate)
│   └── Assign credit packages
├── Counsellor Management
│   ├── Onboard counsellors (in-house/external)
│   ├── Verify credentials
│   ├── Set rates
│   └── Assign to organizations
├── Content Management
│   ├── Assessments / Questionnaires
│   ├── Theory Sessions
│   ├── Breathing Exercises
│   └── Assignments
├── Credit & Billing
│   ├── Credit packages (50/100/500 sessions)
│   ├── Org billing history
│   └── Revenue reports
├── Platform Analytics
│   ├── Total users across all orgs
│   ├── Active sessions
│   ├── Consultation metrics
│   └── Platform health
└── Settings
    ├── Email templates
    ├── Notification rules
    └── System configuration
```

---

## 5. WHAT STAYS vs WHAT CHANGES vs WHAT'S NEW

### ✅ Keeps (Already Built — Reuse)

| Feature | Status | Changes Needed |
|---|---|---|
| Auth system (JWT) | ✅ Built | Add org code to login flow |
| Breathing exercises (animated) | ✅ Built | No change — works as-is |
| Theory sessions + progress | ✅ Built | Add "assigned by" field |
| Assessment quiz flow | ✅ Built | Add "assigned by" + "mandatory" flag |
| Counsellor profiles | ✅ Built | Add availability + booking |
| Analytics (user + admin) | ✅ Built | Add org-level aggregation |
| Admin CRUD (users, questionnaires) | ✅ Built | Scope to org context |
| Dark/light mode | ✅ Built | No change |
| Rate limiting, API structure | ✅ Built | No change |

### 🔄 Changes (Modify Existing)

| Feature | What Changes |
|---|---|
| **User model** | Add `organizationId`, `role` (student/teacher/employee/HR) |
| **Registration** | Requires org code, auto-assigns org |
| **Login** | Org code first, then email/password |
| **Admin dashboard** | Scoped to org (Org Admin) or all orgs (Super Admin) |
| **User management** | Scoped to org, add role assignment |
| **Questionnaire assignment** | Can be assigned to specific users/groups with deadlines |

### 🆕 New Features

| Feature | Priority | Effort |
|---|---|---|
| **Organization model + CRUD** | P0 | 1 day |
| **Org code validation + login flow** | P0 | 0.5 day |
| **Credit system** | P1 | 1 day |
| **Consultation booking** | P1 | 2 days |
| **Counsellor availability/calendar** | P1 | 1 day |
| **Behavior logging (teacher)** | P1 | 1 day |
| **Assignment system** | P1 | 1 day |
| **Teacher dashboard** | P2 | 1 day |
| **HR dashboard** | P2 | 1 day |
| **Session notes** | P2 | 0.5 day |
| **Org-level analytics** | P2 | 1 day |

---

## 6. DATABASE CHANGES

### New Models

```
Organization
├── id, name, type (SCHOOL/CORPORATE), code (unique)
├── logo, address, contactEmail, contactPhone
├── creditBalance, status, createdAt

OrganizationMember
├── id, userId, organizationId
├── role (STUDENT/EMPLOYEE/TEACHER/HR/ORG_ADMIN)
├── class/department (optional)
├── creditBalance (per-user credits)
├── joinedAt

ConsultationSlot
├── id, counsellorId
├── dayOfWeek, startTime, endTime
├── duration (30/60 min), isAvailable

Consultation
├── id, userId, counsellorId, organizationId
├── slotDate, slotTime, duration
├── status (BOOKED/COMPLETED/CANCELLED/NO_SHOW)
├── type (IN_PERSON/VIDEO)
├── creditUsed (1 per session)
├── notes (counsellor's private notes)
├── summary (shareable with teacher/HR)

BehaviorLog
├── id, studentId, teacherId, organizationId
├── date, category (ACADEMIC/SOCIAL/EMOTIONAL/BEHAVIORAL)
├── severity (LOW/MODERATE/HIGH/CRITICAL)
├── notes, flagForCounseling (boolean)
├── counselingStatus (PENDING/SCHEDULED/COMPLETED)

Assignment
├── id, organizationId, assignedBy
├── type (ASSESSMENT/THEORY/BREATHING)
├── targetType (ALL/CLASS/DEPARTMENT/INDIVIDUAL)
├── targetId (classId/deptId/userId)
├── questionnaireId / theorySessionId
├── deadline, mandatory (boolean)
├── status (ACTIVE/EXPIRED)
```

### Modified Models

```
User (add fields)
├── organizationId (nullable — super admins have none)

Counsellor (add fields)
├── type (IN_HOUSE/EXTERNAL)
├── hourlyRate, organizationId (if in-house)

Assessment (add fields)
├── assignmentId (nullable — links to Assignment if assigned)
```

---

## 7. PROTOTYPE TIMELINE — April 1st Target

### What the Prototype Must Demo

1. ✅ Org code login flow (enter code → validate → login/register)
2. ✅ Student dashboard (assessments, breathing, theory, consultations)
3. ✅ Teacher dashboard (behavior log, flag student, class overview)
4. ✅ Consultation booking (browse counsellors → pick slot → book)
5. ✅ Org Admin dashboard (manage users, view reports, credits)
6. ✅ Credit system (visible balance, deduction on booking)
7. ✅ Breathing exercises (already working)
8. ✅ Assessment flow (already working)

### Day-by-Day Plan (March 23 — April 1)

```
Day 1 (Mar 23) — Foundation
├── Add Organization model + migration
├── Add org code validation API
├── Modify login/register to require org code
├── Update auth pages (add org code step)
├── Seed 2 orgs: "Delhi Public School" + "TechCorp India"

Day 2 (Mar 24) — Roles & Members
├── Add OrganizationMember model
├── Role-based middleware (teacher/HR/org-admin)
├── Modify user management to scope by org
├── Org Admin dashboard (user list, invite, roles)

Day 3 (Mar 25) — Credits & Counsellor Availability
├── Add Credit system to org + user
├── Add ConsultationSlot model
├── Counsellor availability API (set/get slots)
├── Counsellor dashboard (schedule view)

Day 4 (Mar 26) — Consultation Booking
├── Booking API (search slots → book → deduct credit)
├── Consultation model + status management
├── User: "Book Consultation" page
├── Counsellor: "My Sessions" page

Day 5 (Mar 27) — Teacher Features
├── BehaviorLog model + API
├── Teacher dashboard (student list, log entry form)
├── Flag for counseling flow
├── Class wellness overview

Day 6 (Mar 28) — Assignments
├── Assignment model + API
├── Org Admin: Assign assessments to class/department
├── Student/Employee: See assigned assessments on dashboard
├── Deadline tracking + completion status

Day 7 (Mar 29) — Analytics & Reports
├── Org-level analytics (scoped by org)
├── Teacher: Class wellness charts
├── HR: Department wellness charts
├── Export CSV for org admin

Day 8 (Mar 30) — Integration & Polish
├── Connect all flows end-to-end
├── Fix navigation for all roles
├── Role-based sidebar/nav (show/hide based on role)
├── Error handling + loading states

Day 9 (Mar 31) — Testing & Fixes
├── E2E test: Org code → Login → Dashboard → Book → Complete
├── Test all role flows
├── Fix bugs found in testing
├── Seed realistic demo data

Day 10 (Apr 1) — Prototype Ready
├── Final smoke test
├── Demo walkthrough script
├── Deploy to Oracle Cloud
├── Share prototype URL with client
```

---

## 8. SYNC: WEB ↔ ANDROID

```
Both apps call the SAME API. Data syncs automatically.

Teacher logs behavior on WEB
  → Student sees notification on ANDROID
  → Counsellor sees flagged student on WEB

Student books consultation on ANDROID
  → Counsellor sees booking on WEB
  → Credit deducted from org balance

Org Admin assigns assessment on WEB
  → Student gets push notification on ANDROID
  → Student completes assessment on ANDROID
  → Results visible to teacher on WEB

Everything is real-time through the shared API.
No separate sync mechanism needed.
```

---

## 9. CREDIT SYSTEM FLOW

```
MindCare sells credit packages to Organizations:
├── Starter: 50 sessions — ₹25,000
├── Growth: 200 sessions — ₹80,000
├── Enterprise: 500 sessions — ₹1,50,000

Organization distributes credits:
├── Equal: 5 credits per student/employee
├── Custom: HR/Admin allocates individually
├── Pool: Shared org pool, first-come first-served

When user books consultation:
├── Check: User has credits? OR Org pool has credits?
├── Yes → Book session, deduct 1 credit
├── No → Show "No credits available. Contact your admin."

Credit tracking:
├── Org Admin sees: Total / Used / Remaining
├── User sees: "You have 3 sessions remaining"
├── Super Admin sees: Revenue per org
```

---

## 10. WHAT'S NOT IN PROTOTYPE (Phase 2)

| Feature | Why Later |
|---|---|
| Video call integration (Zoom/Meet) | Complex, use "join link" for now |
| Payment gateway | Manual billing for prototype |
| iOS app | Android first |
| Push notifications | After Play Store submission |
| Counsellor rating/review | After real sessions |
| Multi-language support | English first |
| Custom branding per org | After MVP |
| Detailed treatment plans | After counsellor feedback |

---

## 11. REUSE SCORECARD

| Existing Code | Reusable? | Effort to Adapt |
|---|---|---|
| Express API + Prisma + JWT auth | ✅ 100% | Add org middleware |
| Breathing exercises (5 exercises, animated UI) | ✅ 100% | Zero changes |
| Theory sessions + progress | ✅ 95% | Add assignment link |
| Assessment quiz flow (MCQ/Scale/YesNo) | ✅ 90% | Add assignment + mandatory flag |
| Counsellor list + detail | ✅ 80% | Add availability + booking |
| User management + bulk register | ✅ 80% | Scope to org |
| Admin dashboard | ✅ 70% | Org-scoped + role-based |
| Dark/light mode + design system | ✅ 100% | Zero changes |
| Android app (6 screens) | ✅ 70% | Add org code + booking |
| Rate limiting + security | ✅ 100% | Zero changes |

**~75% of existing code is directly reusable.** The new work is primarily:
- Organization management (new)
- Consultation booking (new)
- Behavior logging (new)
- Credit system (new)
- Role-based dashboards (new)

---

## 12. RISK ASSESSMENT

| Risk | Impact | Mitigation |
|---|---|---|
| 10 days is tight for all features | High | Prioritize booking + org code for demo |
| Counsellor availability is complex | Medium | Start with simple time slots, no recurring |
| Credit system edge cases | Medium | Keep it simple — 1 credit = 1 session |
| Role-based access across 7 roles | Medium | Start with 4 roles (Super Admin, Org Admin, Student, Counsellor) |
| Android changes needed | Low | Update login flow + add booking screen |

---

## SUMMARY

**Old app:** Individual users → assessments + breathing.
**New app:** Organizations → students/employees → assessments + breathing + consultations + behavior tracking + credits.

**What we keep:** ~75% of existing code (auth, assessments, breathing, theory, design system).
**What we build:** Org management, booking, behavior logs, credits, role-based dashboards.
**Timeline:** 10 days to working prototype, focusing on the demo-able flow.
**Cost:** ₹0/month hosting (Oracle free tier) + ₹2,100 Play Store.

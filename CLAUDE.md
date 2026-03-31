# CLAUDE.md — MindCare Platform | Complete Development Plan

> **Project:** MindCare — Counselling & Wellness Platform
> **Company:** Indic Labs
> **Version:** 1.0 | March 2026
> **Development Tool:** Claude Code (Multi-Agent)
> **Approach:** Web App First → Android App Second

---

## PROJECT STATUS

- **Current Sprint:** 0 (Pre-development)
- **Phase:** Planning Complete, Ready for Sprint 1
- **Blockers:** None
- **Last Updated:** 2026-03-12

---

## PART 1: PRODUCT OVERVIEW

### What We're Building

MindCare is a counselling and wellness platform with:

1. **Web Application (Phase 1):** A SINGLE web app that serves BOTH users AND admins via role-based access. Users can take assessments, browse counsellors, view workshops, read theory sessions, and track analytics. Admins can manage everything — users, counsellors, questionnaires, workshops, theory sessions, bulk registration, and analytics. This is the complete product.

2. **Android App (Phase 2):** A mobile app with USER features only. It consumes the EXACT SAME backend API. Zero backend duplication. Admin controls the Android app through the web dashboard.

### Development Strategy

- **Web First:** Web app contains ALL features (user + admin). Build it completely before starting Android.
- **Shared Backend:** One Node.js API serves both web and Android. Build once, consume twice.
- **Client Hosting:** Client provides hosting (GoDaddy VPS or similar). Plan for MySQL + Node.js on their server.
- **Timeline:** 12 weeks total. Web: Sprints 1–4 (8 weeks). Android: Sprints 4–6 (6 weeks, overlaps).

### Architecture

```
Client's GoDaddy VPS / Hosting
├── /public_html/          ← Next.js static build (frontend)
├── /api/                   ← Node.js Express API (backend)
├── /uploads/               ← User uploaded files (CSV, images)
└── MySQL database          ← Included with hosting

Android App (Play Store)
└── Calls same /api/ endpoints via HTTPS

External Free Services
├── Cloudflare              ← CDN + SSL (free)
├── Firebase                ← Push notifications + analytics (free)
└── Let's Encrypt           ← SSL certificate (free)
```

### Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router, static export) | Deploys on any hosting as static HTML/JS |
| UI | Tailwind CSS + shadcn/ui | Premium, modern components |
| State | Zustand | Lightweight, no Redux overhead |
| Backend | Node.js 20 + Express.js | Runs on any Linux server |
| ORM | Prisma | Works with MySQL and PostgreSQL |
| Database | MySQL 8 | Included with GoDaddy hosting |
| Auth | JWT (access + refresh) + bcrypt | Stateless, works with any hosting |
| File Upload | Multer + local filesystem | Migrate to S3 later if needed |
| Charts | Recharts | Lightweight, React-native compatible |
| Email | Nodemailer + SMTP | Works with any email provider |
| Android | React Native (Expo) | Shared JS patterns, fast builds |
| Testing | Vitest + Playwright | Unit + E2E |
| Push | Firebase Cloud Messaging | Free, unlimited |

---

## PART 2: AGENT TEAM & PROMPTS

### Agent Roles

| Agent | Role | Owns | Reports To |
|---|---|---|---|
| @pm | Product Manager | PRD, user stories, sprint planning | Project Lead (you) |
| @ui | UI/UX Designer | Design system, component specs | @pm |
| @frontend | Frontend Developer | React pages, components, API integration | @pm + @ui |
| @backend | Backend Developer | API routes, database, auth, business logic | @pm |
| @qa | QA & Testing | Test cases, E2E tests, bug reports | @pm |

### How to Use Agents in Claude Code

These are ROLES you switch between in Claude Code sessions. Each role reads this CLAUDE.md for context.

**Workflow:**
1. Start session → tell Claude which agent role to assume
2. Claude reads this CLAUDE.md for project state
3. Claude works on tasks for that agent's current sprint
4. Before ending → Claude updates the relevant section of this file
5. Next session → switch to different agent, Claude picks up from here

---

### AGENT PROMPT: @pm (Product Manager)

```
You are the Product Manager (@pm) for MindCare, a counselling & wellness platform.

FIRST: Read CLAUDE.md in the project root for current project state, architecture decisions, and sprint progress.

Your responsibilities:
- Break features into user stories with acceptance criteria
- Prioritize the backlog for the current sprint
- Write clear specs that @frontend and @backend can implement
- Track progress and update CLAUDE.md ## PROJECT STATUS after every session
- Make architecture decisions when conflicts arise between agents
- Ensure web app is built first with ALL features before Android starts

Project context:
- Phase 1: Web app (Next.js frontend + Node.js API + MySQL on client's GoDaddy VPS)
- Phase 2: Android app (React Native/Expo, same API)
- Web app has BOTH user AND admin features (role-based access)
- 12 weeks total: 8 weeks web, 6 weeks Android (with overlap)

User story format: As a [user/admin], I want [feature], so that [benefit]

Rules:
- Always update CLAUDE.md when done
- Flag blockers immediately in CLAUDE.md ## PROJECT STATUS → Blockers
- Keep it simple. No over-engineering. Ship fast.
- If a decision needs to be made, make it and document in CLAUDE.md ## ARCHITECTURE DECISIONS
```

---

### AGENT PROMPT: @ui (UI/UX Designer)

```
You are the UI/UX Designer (@ui) for MindCare, a counselling & wellness platform.

FIRST: Read CLAUDE.md in the project root — especially the COMPLETE UI SPECIFICATION section. This contains the EXACT design system, every screen layout, every component spec, and the full color palette for dark and light modes.

Your responsibilities:
- Maintain the design system defined in CLAUDE.md (do NOT deviate from it)
- Create component specifications with exact Tailwind classes for @frontend
- Ensure responsive design (mobile-first: 360px → 768px → 1440px)
- Review @frontend implementations for design accuracy
- Maintain a /docs/design-system.md with living component specs

Design system (ALREADY DECIDED — see PART 3 of CLAUDE.md for full details):
- Dark mode default, light mode secondary
- Fonts: Playfair Display (headings) + DM Sans (body)
- Primary: #0D9488 (teal), Accent: #6FFFE9 (mint)
- Dark bg: #0B0C10, Light bg: #F5F7FA
- Glass morphism cards, 16px border radius, premium aesthetic
- Inspired by CRED and Flow apps

Rules:
- Always update CLAUDE.md @ui section when done
- Create /docs/design-system.md with component catalog
- Provide exact Tailwind classes (not vague descriptions)
- Every page must work on mobile (360px) and desktop (1440px)
- All colors, spacing, and typography are in CLAUDE.md — follow them exactly
```

---

### AGENT PROMPT: @frontend (Frontend Developer)

```
You are the Frontend Developer (@frontend) for MindCare.

FIRST: Read CLAUDE.md — especially PART 3 (UI Specification) and PART 4 (Web App PRD) for exact screen layouts, component specs, colors, and feature requirements.

Your responsibilities:
- Build all React components and pages using Next.js 14 App Router
- Implement the EXACT design system from CLAUDE.md (colors, fonts, spacing, components)
- Integrate with backend API built by @backend (endpoints listed in CLAUDE.md PART 4)
- Handle client-side state with Zustand
- Build role-based routing (USER sees user pages, ADMIN sees admin + user pages)
- Export as static build for deployment on client's hosting

Tech:
- Next.js 14 App Router (static export: output: 'export' in next.config.js)
- Tailwind CSS + shadcn/ui
- Zustand for auth/user state
- Axios for API calls
- Recharts for analytics
- React Hook Form + Zod for validation

Project structure:
/app
  /(auth)/login, /register, /forgot-password
  /(user)/dashboard, /assessment, /counsellors, /counsellors/[id], /events, /theory, /analytics, /profile
  /(admin)/admin/dashboard, /admin/users, /admin/counsellors, /admin/questionnaire, /admin/workshops, /admin/theory, /admin/bulk-register, /admin/analytics
/components/ui (shadcn components)
/components/shared (app-specific shared components)
/lib/api.ts (Axios instance with interceptors)
/lib/auth.ts (JWT helpers)
/stores/auth-store.ts (Zustand auth store)

Rules:
- Always update CLAUDE.md @frontend section when done
- Use NEXT_PUBLIC_API_URL env variable for API base
- Handle loading, success, error states on EVERY API call
- All forms validate client-side before hitting API
- No hardcoded data — everything from the API
- Follow the EXACT color palette and component specs in CLAUDE.md PART 3
```

---

### AGENT PROMPT: @backend (Backend Developer)

```
You are the Backend Developer (@backend) for MindCare.

FIRST: Read CLAUDE.md — especially PART 4 (complete API endpoint list and database schema).

Your responsibilities:
- Build REST API with Node.js + Express
- Design and manage MySQL database with Prisma ORM
- Implement JWT auth (access token 15min + refresh token 7 days)
- Build CRUD for all modules (users, counsellors, categories, levels, questions, questionnaires, assessments, workshops, theory sessions, mood logs)
- Handle file uploads (CSV bulk register, counsellor photos)
- Role-based middleware (USER vs ADMIN routes)
- Analytics aggregation queries

API conventions:
- All routes: /api/v1/{resource}
- Success response: { success: true, data: {...} }
- Error response: { success: false, error: "message", code: "ERROR_CODE" }
- List response: { success: true, data: [...], pagination: { page, limit, total, totalPages } }
- Auth header: Authorization: Bearer {accessToken}
- Admin routes use requireAdmin middleware
- Pagination: ?page=1&limit=20 on all list endpoints
- Soft delete (status: INACTIVE) not hard delete

Project structure:
/src
  /routes (auth.js, users.js, counsellors.js, categories.js, levels.js, questions.js, questionnaires.js, assessments.js, workshops.js, theory.js, mood.js, analytics.js)
  /middleware (auth.js, admin.js, validate.js, upload.js)
  /controllers (same as routes)
  /services (business logic)
  /utils (helpers, email, csv-parser)
/prisma
  schema.prisma
  /migrations
  seed.js

Rules:
- Always update CLAUDE.md @backend section when done
- Validate ALL input with Zod
- Never expose internal errors — log internally, return generic message
- Write seed script: npm run seed (creates test admin + test user + sample data)
- Every schema change = new migration file
```

---

### AGENT PROMPT: @qa (QA & Testing)

```
You are the QA and Testing Lead (@qa) for MindCare.

FIRST: Read CLAUDE.md for current sprint progress and feature status.

Your responsibilities:
- Write test cases for every completed feature
- Create E2E tests with Playwright (user flows)
- Create API unit tests with Vitest
- Test role-based access (user CANNOT access admin routes)
- Validate frontend matches the UI specs in CLAUDE.md PART 3
- Performance check: all API responses < 200ms
- Security check: SQL injection, XSS, auth bypass

Bug report format:
[BUG-001] Short title
- Steps to reproduce: 1. Go to... 2. Click... 3. Enter...
- Expected: ...
- Actual: ...
- Severity: Critical / High / Medium / Low

Test structure:
/tests
  /api (Vitest API tests)
  /e2e (Playwright browser tests)
  /fixtures (test data)

Test accounts:
- Admin: admin@mindcare.com / Admin@123
- User: user@mindcare.com / User@123

Rules:
- Always update CLAUDE.md @qa section when done
- Run full test suite before marking any sprint complete
- Test on Chrome + Firefox + Safari (web) and Android emulator + real device
- Every critical/high bug must block sprint completion until fixed
```

---

## PART 3: COMPLETE UI SPECIFICATION

> **This section is the SINGLE SOURCE OF TRUTH for all visual design.**
> All agents (@ui, @frontend) must follow these specs exactly.
> These specs were extracted from client-approved interactive HTML mockups.

### 3.1 Design Philosophy

- **Dark-first, premium aesthetic** inspired by CRED and Flow apps
- **Glass morphism** cards with blur and subtle borders
- **Minimal, clean layouts** — no clutter, generous whitespace
- **Typography-driven hierarchy** — Playfair Display for impact, DM Sans for readability
- **Both dark and light modes** — dark is primary, light is secondary

### 3.2 Color System

#### Dark Mode (Primary)

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#0B0C10` | Page background |
| `--bg-body` | `#050505` | Body/outer background |
| `--bg-card` | `rgba(255,255,255,0.04)` | Glass card background |
| `--bg-card-hover` | `rgba(255,255,255,0.06)` | Card hover state |
| `--border-card` | `rgba(255,255,255,0.06)` | Card/glass borders |
| `--accent-primary` | `#6FFFE9` | Mint — primary accent, CTAs, active states |
| `--accent-secondary` | `#5BC0BE` | Teal — gradients, secondary accent |
| `--text-primary` | `#FFFFFF` | Headings, primary text |
| `--text-secondary` | `rgba(255,255,255,0.6)` | Body text |
| `--text-muted` | `rgba(255,255,255,0.35)` | Labels, hints, placeholders |
| `--text-disabled` | `rgba(255,255,255,0.2)` | Disabled text |
| `--accent-red` | `#FF6B6B` | Errors, counsellor card accent |
| `--accent-yellow` | `#FFD93D` | Warnings, star ratings |
| `--accent-purple` | `#A78BFA` | Theory, alternative accent |
| `--accent-green` | `#4ADE80` | Success, completion |
| `--gradient-cta` | `linear-gradient(135deg, #6FFFE9, #5BC0BE)` | CTA buttons |
| `--gradient-splash` | `linear-gradient(160deg, #0B0C10, #0D1117, #0B1A1A)` | Splash screen |
| `--pill-active-bg` | `rgba(111,255,233,0.12)` | Active filter pill |
| `--pill-active-border` | `rgba(111,255,233,0.25)` | Active pill border |
| `--nav-bg` | `rgba(11,12,16,0.95)` | Bottom nav bar |
| `--input-bg` | `rgba(255,255,255,0.04)` | Input field background |
| `--input-border` | `rgba(255,255,255,0.08)` | Input border |
| `--progress-bg` | `rgba(255,255,255,0.06)` | Progress bar track |
| `--tag-bg` | `rgba(111,255,233,0.1)` | Tag/chip background |
| `--tag-border` | `rgba(111,255,233,0.15)` | Tag border |

#### Light Mode (Secondary)

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#FAFBFC` | Page background |
| `--bg-body` | `#F5F7FA` | Body background |
| `--bg-card` | `rgba(255,255,255,0.7)` | Card background |
| `--border-card` | `rgba(0,0,0,0.06)` | Card borders |
| `--accent-primary` | `#0D9488` | Teal — primary accent (NOT mint) |
| `--accent-secondary` | `#0A7A70` | Darker teal for gradients |
| `--text-primary` | `#1A1A2E` | Navy — headings, primary text |
| `--text-secondary` | `rgba(0,0,0,0.6)` | Body text |
| `--text-muted` | `rgba(0,0,0,0.35)` | Labels, hints |
| `--gradient-cta` | `linear-gradient(135deg, #0D9488, #0A7A70)` | CTA buttons (white text) |
| `--gradient-splash` | `linear-gradient(160deg, #E6FFFA, #B2F5EA, #81E6D9)` | Splash (mint gradient) |
| `--nav-bg` | `rgba(255,255,255,0.95)` | Bottom nav |
| `--input-bg` | `rgba(0,0,0,0.02)` | Input background |
| `--input-border` | `rgba(0,0,0,0.08)` | Input border |
| `--tag-bg` | `rgba(13,148,136,0.1)` | Tag background |
| `--tag-border` | `rgba(13,148,136,0.15)` | Tag border |
| `--pill-active-bg` | `rgba(13,148,136,0.12)` | Active pill |
| `--card-shadow` | `0 1px 8px rgba(0,0,0,0.04)` | Subtle card shadow |

### 3.3 Typography

| Element | Font | Size | Weight | Letter Spacing |
|---|---|---|---|---|
| App title / Logo | Playfair Display | 32px | 700 | 2px |
| Page heading (h1) | Playfair Display | 22–28px | 600–700 | 0 |
| Section heading (h2) | Playfair Display | 15–20px | 600 | 0 |
| Sub-heading (h3) | DM Sans | 14–15px | 600 | 0 |
| Body text | DM Sans | 13–14px | 400 | 0 |
| Small text / labels | DM Sans | 10–12px | 400–500 | 0.5–1.5px |
| Uppercase labels | DM Sans | 9–10px | 400 | 1.5–4px |
| CTA button text | DM Sans | 14px | 600 | 0.5px |
| Tag/chip text | DM Sans | 10–11px | 500 | 0.3px |

Google Fonts import:
```
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&family=Playfair+Display:wght@400;600;700&display=swap');
```

### 3.4 Spacing & Layout

| Token | Value | Usage |
|---|---|---|
| `--radius-card` | 16–20px | Cards, modals |
| `--radius-button` | 16px | CTA buttons |
| `--radius-pill` | 100px | Tags, filter pills, chips |
| `--radius-input` | 14px | Input fields |
| `--radius-icon` | 12–14px | Icon containers |
| `--glass-blur` | `backdrop-filter: blur(20px)` | Glass morphism effect |
| `--page-padding` | 20–24px (mobile), 40px (desktop) | Page horizontal padding |
| `--card-padding` | 16–18px | Inner card padding |
| `--gap-cards` | 12–14px | Space between cards |
| `--phone-width` | 290px | Mobile phone frame width |
| `--phone-height` | 600px | Mobile phone frame height |
| `--sidebar-width` | 240px | Admin sidebar width |
| `--status-bar-height` | 32px | Mobile status bar |
| `--bottom-nav-height` | 70px | Mobile bottom navigation |

### 3.5 Component Specs

#### Glass Card
```css
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-card);
  border-radius: 16px;
  /* Light mode adds: box-shadow: 0 1px 8px rgba(0,0,0,0.04); */
}
```

#### CTA Button
```css
.cta-button {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 16px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.5px;
  background: var(--gradient-cta);
  color: #0B0C10; /* dark mode */
  /* Light mode: color: #FFFFFF */
  transition: all 0.3s;
}
.cta-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 30px rgba(111,255,233,0.2);
}
```

#### Tag / Chip
```css
.tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 10px;
  font-weight: 500;
  background: var(--tag-bg);
  color: var(--accent-primary);
  border: 1px solid var(--tag-border);
}
```

#### Input Field
```css
.input-field {
  width: 100%;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-primary);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
}
.input-field:focus {
  border-color: rgba(111,255,233,0.3);
  outline: none;
}
```

#### Filter Pill (Active State)
```css
.pill-active {
  padding: 8px 16px;
  border-radius: 100px;
  background: var(--gradient-cta);
  color: #0B0C10;
  font-size: 11px;
  font-weight: 500;
}
.pill-inactive {
  padding: 8px 16px;
  border-radius: 100px;
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
}
```

#### Status Bar (Mobile)
```css
.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 8px 20px 0;
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  height: 32px;
}
```

#### Bottom Navigation (Mobile)
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: var(--nav-bg);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--border-card);
  display: flex;
  justify-content: space-around;
  align-items: center;
}
/* Active tab: accent color icon + label */
/* Inactive tab: muted color icon + label, opacity 0.35 */
```

---

### 3.6 Mobile App Screens (11 Screens)

> These are the EXACT screens shown to the client in the approved HTML mockup.
> @frontend must recreate these for the web app user view.
> Android app will have the same screens (minus admin).

#### Screen 1: Splash
- Full-screen gradient background (`--gradient-splash`)
- Centered: app icon (72x72px, rounded 22px, gradient fill, brain emoji 🧠)
- App name "MindCare" — Playfair Display, 32px, 700 weight, 2px letter-spacing
- Subtitle "your mind matters" — 10px, uppercase, 4px letter-spacing, muted color
- Floating orb effect: large blurred circle (200px, accent color, 6% opacity, blur 60px)
- Bottom shimmer bar: 40x3px, gradient from transparent→accent→transparent

#### Screen 2: Onboarding
- Skip button top-right (12px, muted, "Skip →")
- Centered icon: 120x120px rounded container (40px radius), accent bg at 10%, plant emoji 🌿, floating animation
- Title: Playfair Display, 24px, "Understand / Your Mind" with line break, second line uses accent gradient text
- Description: centered, 13px, muted color, max-width 220px, "Take expert-crafted assessments..."
- Dot indicators: 3 dots (8px wide except active = 24px, height 3px, rounded)
- CTA button: full-width, "Get Started"

#### Screen 3: Login
- Header: Playfair Display 28px, "Welcome / Back." (accent dot), subtitle: "Sign in to continue your journey"
- Email field: uppercase label (10px, 1.5px spacing), input with placeholder "hello@example.com"
- Password field: same label style, dots placeholder, "Show" toggle in accent color
- "Forgot password?" link in accent color, right-aligned
- CTA button: "Sign In"
- Divider: "OR" with horizontal lines on both sides
- Social login: two glass cards side by side ("G" and Apple icon), 14px, rounded 14px
- Bottom: "New here? Create account" — muted + accent text

#### Screen 4: Home Dashboard
- Greeting: "Good morning" (12px muted) + "Sarah ✨" (Playfair 22px)
- Mood check-in: glass card, "How are you feeling today?" (11px muted), 5 emoji buttons (44x44px, rounded 14px), first one active with accent pill bg
- Quick action grid: 2x2 grid of glass cards, each has icon (36x36px rounded container), title (13px bold), subtitle (10px muted). Cards: 📋 Assessment / 👤 Counsellors / 🎯 Workshops / 📖 Theory. Each icon has different accent color bg
- Upcoming section: Playfair 15px heading, glass card with date block (44x44px, accent bg, date + month), event title (13px bold), type + time (10px muted), "Live" tag
- Bottom nav: 4 tabs — Home (active, accent), Explore, Sessions, Profile (inactive, muted, opacity 0.35)

#### Screen 5: Assessment
- Back arrow (18px, muted) + title "Self Assessment" (12px bold center) + "4/8" counter
- Progress bar: 8 segments (equal flex), first 4 filled with accent gradient, rest is progress-bg
- Tag: "Anxiety Level" in accent tag style + "50% complete" muted right-aligned
- Question: Playfair 22px, "How often do you feel anxious or worried?" with accent question mark
- 4 radio options (stacked, 10px gap): each is 16px padding, 16px radius, glass-style. Selected option: accent bg, gradient radio circle with checkmark, bold text. Unselected: card bg, empty circle with border
- CTA at bottom: "Next Question →"

#### Screen 6: Counsellors
- Title: Playfair 22px, "Find Your / Expert" (second line accent gradient)
- Search bar: glass card, 14px radius, search icon + "Search by name or specialization..." placeholder
- Filter pills: horizontal scrollable. "All" active (accent pill), "Anxiety", "Depression", "CBT" inactive
- Counsellor cards (stacked, 12px gap): glass card 20px radius, each has:
  - Avatar icon (48x48, colored bg), Name (14px bold), Specialization + years (11px muted), Star rating (11px yellow ⭐), Expertise tags (9px accent tags)
  - 3 counsellors shown: Dr. Priya Sharma (Clinical Psychologist, 8 yrs, 4.9), Dr. Arjun Mehta (Counselling Psych, 5 yrs, 4.8), Dr. Neha Gupta (Behavioral Therapist, 10 yrs, 4.9)

#### Screen 7: Counsellor Profile Detail
- Back arrow
- Hero: centered, avatar 80x80px (28px radius, accent bg), name Playfair 20px, specialization 12px muted, rating + session count centered below
- Tag cloud: centered, 8px gap wrapping: Anxiety, Depression, CBT, Trauma, Self-esteem
- About section: glass card, "ABOUT" uppercase label (11px), paragraph text (12px, muted)
- Qualifications: glass card, "QUALIFICATIONS" label, bulleted list with accent dot markers (6x6px rounded)

#### Screen 8: Workshops & Events
- Title: Playfair 22px, "Workshops." (accent dot), subtitle 12px muted "Grow through shared experiences"
- Event cards (stacked, 14px gap): glass card 20px radius, colored top bar (4px height, event-specific color)
  - Title (15px bold), date+time (11px muted), type tag (pill, colored)
  - Bottom: overlapping avatar circles (20px each, -6px margin overlap) + "45 joined" text, "View →" link in accent
  - 3 events: Stress Management (accent color, Workshop), Mindful Living (purple, Seminar), Dealing with Burnout (red, Workshop)

#### Screen 9: Theory Sessions
- Title: Playfair 22px, "Theory." (accent dot), subtitle "Learn at your own pace"
- Session cards (stacked, 14px gap): glass card 20px radius
  - Icon (48x48, accent bg), Title (14px bold), module count + duration (10px muted)
  - Progress bar: track (3px height) + filled portion + label (10px). States: "Start" (0%), "60%" (in progress), "Done" (100%, green)
  - 3 sessions: Understanding Anxiety (60%), CBT Basics (0%), Emotional Regulation (100%)

#### Screen 10: Analytics (User View)
- Title: Playfair 22px, "Analytics." (accent dot), subtitle "Your wellness journey data"
- KPI cards: 2-column grid, glass cards, centered
  - Assessments: count "12" (28px bold Playfair, accent), "+3 this week" (9px muted)
  - Avg Score: "72%" (28px Playfair, red), "↑ 8% improvement" (9px muted)
- Wellness Trend: glass card, "Wellness Trend" title + "Last 7 days" tag, bar chart (7 bars for Mon-Sun, varying heights 40-90%, gradient fill from transparent→accent)
- Category Scores: Playfair 14px heading, stacked glass cards with category name, percentage, progress bar
  - Anxiety 68% (accent), Stress 82% (red), Self-esteem 55% (purple), Depression 74% (yellow)

#### Screen 11: My Profile
- Centered avatar: 72x72px, 24px radius, accent gradient fill, initial letter "S" (32px bold)
- Name: Playfair 20px, "Sarah Johnson", subtitle "Member since Mar 2026"
- Stats grid: 3 equal columns, glass cards, centered — "12 Assessments", "3 Sessions", "7d Streak"
- Menu items (stacked, separated by subtle border): icon + label + arrow →
  - 📊 Assessment History / 🔔 Notifications / 🔒 Privacy & Security / ⚙️ Settings
- CTA outline button: "Sign Out" (accent border, accent text)

---

### 3.7 Admin Web Dashboard Screens (8 Sections)

> These are the EXACT sections shown in the approved admin dashboard HTML mockup.
> The admin dashboard uses a fixed left sidebar (240px) + content area.

#### Layout: Admin Shell
- **Sidebar (fixed left, 240px width):**
  - Logo: brain emoji + "MindCare" (Playfair 18px)
  - Nav sections: "MAIN" and "MANAGEMENT" labels (9px uppercase, muted)
  - Nav items: icon + label (13px), 10px padding, 10px radius. Active: accent bg 8%, accent text. Inactive: muted text. Hover: slightly lighter bg
  - 8 nav items: Dashboard, Users, Counsellors, Questionnaire, Workshops, Theory, Bulk Register, Analytics
  - Bottom: admin avatar (gradient, initials) + name + "Super Admin" label

- **Top bar:** Page title (Playfair 26px) + subtitle (12px muted) + search box + notification icon + avatar

#### Section 1: Admin Dashboard
- 4 KPI cards (grid): Total Users (12,459, accent), Active Sessions (842, red), Counsellors (56, purple), Completion Rate (87%, green). Each has label, big number, "+X% this month" delta
- Registration Trend: glass card, bar chart (monthly, 12 bars)
- Category Distribution: glass card, donut chart with legend
- Recent Users: table (5 rows) — ID, Name, Email, Joined, Status tag
- Upcoming Events: card list with date blocks

#### Section 2: User Management
- Search box + filter dropdown + "Add User" button
- Data table: ID, Name, Email, Joined Date, Status (Active/Inactive tag), Actions (Edit/View icons)
- Pagination: "Showing 1-10 of 1,245" + page buttons
- Edit modal/page: name, email, role, status fields

#### Section 3: Counsellor Management
- Card grid layout (not table)
- Each card: avatar (48px), name, specialization, years, rating stars, session count, edit/view buttons, status tag
- "Add Counsellor" floating button (accent gradient)
- Add form: name, specialization, qualifications (textarea), experience, bio, tags (multi-select), photo upload

#### Section 4: Questionnaire Builder
- 4-step flow indicator: Categories → Levels → Questions → Build Quiz
- Step 1 (Categories): list with name, description, question count, edit/delete actions, "Add Category" button
- Step 2 (Levels): filtered by selected category, name, order number, question count
- Step 3 (Questions): filtered by category+level, question text, type tag (MCQ/Scale/YesNo), options preview
- Step 4 (Build Questionnaire): select category + level dropdowns, available questions checklist (add/remove), quiz title, publish toggle

#### Section 5: Workshops & Events
- Create form: title, type (dropdown: Workshop/Seminar/Webinar), date picker, time input, description (textarea), capacity (number)
- Event cards below form: title, type tag, date, time, registration progress bar (registered/capacity), edit/delete

#### Section 6: Theory Sessions
- Module cards: title, module count, completion count, status (Published green / Draft yellow), edit/delete
- Create form: title, description, modules (add/remove/reorder), duration, publish toggle

#### Section 7: Bulk Registration
- Upload zone: dashed border (2px), drag-drop area, "Drop your CSV or Excel file here" text, file browser button, accepted formats note (.csv, .xlsx)
- Required columns listed: name, email, phone (optional)
- "Download Template" link
- Upload history table: filename, date, total rows, success count, error count, status tag (Completed/Partial/Failed)

#### Section 8: Admin Analytics
- 4 KPI cards: same as admin dashboard
- Completion rates by category: horizontal progress bars with percentage labels
- Counsellor load metrics: horizontal bar chart
- Date range filter (top-right)
- Export button: "Download CSV"

---

## PART 4: WEB APP PRD (Complete Feature Spec)

### Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum Status {
  ACTIVE
  INACTIVE
}

enum QuestionType {
  MCQ
  SCALE
  YESNO
}

model User {
  id          Int          @id @default(autoincrement())
  email       String       @unique
  password    String
  name        String
  phone       String?
  avatar      String?
  gender      String?
  age         Int?
  role        Role         @default(USER)
  status      Status       @default(ACTIVE)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  assessments Assessment[]
  moodLogs    MoodLog[]
  progress    TheoryProgress[]
}

model Counsellor {
  id              Int      @id @default(autoincrement())
  name            String
  specialization  String
  qualifications  String   @db.Text
  experience      Int
  bio             String   @db.Text
  rating          Float    @default(0)
  photo           String?
  status          Status   @default(ACTIVE)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tags            CounsellorTag[]
}

model CounsellorTag {
  id           Int        @id @default(autoincrement())
  name         String
  counsellorId Int
  counsellor   Counsellor @relation(fields: [counsellorId], references: [id], onDelete: Cascade)
}

model Category {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?   @db.Text
  createdAt   DateTime  @default(now())
  levels      Level[]
}

model Level {
  id          Int        @id @default(autoincrement())
  name        String
  order       Int        @default(0)
  categoryId  Int
  category    Category   @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  questions   Question[]

  @@unique([categoryId, order])
}

model Question {
  id      Int          @id @default(autoincrement())
  text    String       @db.Text
  type    QuestionType @default(MCQ)
  options Json
  levelId Int
  level   Level        @relation(fields: [levelId], references: [id], onDelete: Cascade)
}

model Questionnaire {
  id          Int       @id @default(autoincrement())
  title       String
  categoryId  Int
  levelId     Int
  questionIds Json
  published   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  assessments Assessment[]
}

model Assessment {
  id                Int           @id @default(autoincrement())
  userId            Int
  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  questionnaireId   Int
  questionnaire     Questionnaire @relation(fields: [questionnaireId], references: [id])
  answers           Json
  score             Float
  completedAt       DateTime      @default(now())
}

model Workshop {
  id          Int      @id @default(autoincrement())
  title       String
  type        String
  date        DateTime
  time        String
  description String   @db.Text
  capacity    Int
  status      String   @default("draft")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TheorySession {
  id          Int      @id @default(autoincrement())
  title       String
  description String   @db.Text
  modules     Json
  duration    Int
  status      String   @default("draft")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  progress    TheoryProgress[]
}

model TheoryProgress {
  id              Int           @id @default(autoincrement())
  userId          Int
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  theorySessionId Int
  theorySession   TheorySession @relation(fields: [theorySessionId], references: [id], onDelete: Cascade)
  completedModules Json         @default("[]")
  completed       Boolean       @default(false)
  updatedAt       DateTime      @updatedAt

  @@unique([userId, theorySessionId])
}

model MoodLog {
  id     Int      @id @default(autoincrement())
  userId Int
  user   User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  mood   Int
  date   DateTime @default(now())
}

model BulkUpload {
  id         Int      @id @default(autoincrement())
  filename   String
  totalRows  Int
  successCount Int
  errorCount Int
  status     String   @default("processing")
  errors     Json?
  uploadedBy Int
  createdAt  DateTime @default(now())
}
```

### API Endpoints (Complete)

#### Auth
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Register new user | No |
| POST | `/api/v1/auth/login` | Login → JWT tokens | No |
| POST | `/api/v1/auth/forgot-password` | Send reset email | No |
| POST | `/api/v1/auth/reset-password` | Reset with token | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | Refresh |
| GET | `/api/v1/auth/me` | Current user profile | Bearer |
| PUT | `/api/v1/auth/me` | Update own profile | Bearer |
| PUT | `/api/v1/auth/change-password` | Change password | Bearer |

#### Users (Admin Only)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/users` | List all users (paginated, searchable) | Admin |
| GET | `/api/v1/users/:id` | Get user detail + assessment history | Admin |
| PUT | `/api/v1/users/:id` | Update user (name, email, role, status) | Admin |
| PATCH | `/api/v1/users/:id/status` | Toggle active/inactive | Admin |
| POST | `/api/v1/users/bulk` | Bulk register from CSV upload | Admin |
| GET | `/api/v1/users/bulk/history` | Bulk upload history | Admin |
| GET | `/api/v1/users/bulk/template` | Download CSV template | Admin |

#### Counsellors
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/counsellors` | List all (filterable by tag) | User |
| GET | `/api/v1/counsellors/:id` | Get detail with tags | User |
| POST | `/api/v1/counsellors` | Create with tags + photo | Admin |
| PUT | `/api/v1/counsellors/:id` | Update counsellor | Admin |
| DELETE | `/api/v1/counsellors/:id` | Soft delete (status→INACTIVE) | Admin |

#### Categories, Levels, Questions (Admin CRUD, User Read)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/categories` | List all categories | User |
| POST | `/api/v1/categories` | Create category | Admin |
| PUT | `/api/v1/categories/:id` | Update category | Admin |
| DELETE | `/api/v1/categories/:id` | Delete category | Admin |
| GET | `/api/v1/categories/:id/levels` | List levels in category | User |
| POST | `/api/v1/levels` | Create level | Admin |
| PUT | `/api/v1/levels/:id` | Update level | Admin |
| DELETE | `/api/v1/levels/:id` | Delete level | Admin |
| GET | `/api/v1/levels/:id/questions` | List questions in level | Admin |
| POST | `/api/v1/questions` | Create question | Admin |
| PUT | `/api/v1/questions/:id` | Update question | Admin |
| DELETE | `/api/v1/questions/:id` | Delete question | Admin |

#### Questionnaires & Assessments
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/questionnaires` | List published questionnaires | User |
| GET | `/api/v1/questionnaires/:id` | Get questionnaire with questions | User |
| POST | `/api/v1/questionnaires` | Create questionnaire | Admin |
| PUT | `/api/v1/questionnaires/:id` | Update/publish questionnaire | Admin |
| DELETE | `/api/v1/questionnaires/:id` | Delete questionnaire | Admin |
| POST | `/api/v1/assessments` | Submit assessment attempt | User |
| GET | `/api/v1/assessments/my` | My assessment history | User |
| GET | `/api/v1/assessments/my/:id` | Single assessment detail | User |

#### Workshops
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/workshops` | List workshops (published) | User |
| GET | `/api/v1/workshops/:id` | Workshop detail | User |
| POST | `/api/v1/workshops` | Create workshop | Admin |
| PUT | `/api/v1/workshops/:id` | Update workshop | Admin |
| DELETE | `/api/v1/workshops/:id` | Delete workshop | Admin |

#### Theory Sessions
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/theory-sessions` | List sessions (published) | User |
| GET | `/api/v1/theory-sessions/:id` | Session detail with modules | User |
| POST | `/api/v1/theory-sessions` | Create session | Admin |
| PUT | `/api/v1/theory-sessions/:id` | Update session | Admin |
| DELETE | `/api/v1/theory-sessions/:id` | Delete session | Admin |
| POST | `/api/v1/theory-sessions/:id/progress` | Update user progress | User |
| GET | `/api/v1/theory-sessions/:id/progress` | Get my progress | User |

#### Mood & Analytics
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/mood` | Log mood (1-5) | User |
| GET | `/api/v1/mood/history` | My mood history (date range) | User |
| GET | `/api/v1/analytics/user` | Personal analytics (scores, trends) | User |
| GET | `/api/v1/analytics/admin` | Admin dashboard stats | Admin |
| GET | `/api/v1/analytics/admin/export` | Export analytics CSV | Admin |

---

## PART 5: ANDROID APP PRD

The Android app consumes the SAME API. No backend changes.

### Screen → API Mapping

| Screen | API Endpoints | Notes |
|---|---|---|
| Splash + Onboarding | None | Local only, shown once |
| Login / Register | `/auth/register`, `/auth/login` | Same JWT flow |
| Home Dashboard | `/auth/me`, `/mood`, `/workshops` | Greeting + mood + events |
| Self Assessment | `/categories`, `/levels`, `/questionnaires`, `/assessments` | Full quiz flow |
| Counsellor List | `/counsellors` | With search/filter |
| Counsellor Profile | `/counsellors/:id` | Detail page |
| Workshops | `/workshops` | Event listing |
| Theory Sessions | `/theory-sessions`, `/theory-sessions/:id/progress` | With progress |
| Analytics | `/analytics/user`, `/mood/history` | Charts + scores |
| Profile | `/auth/me` | Edit profile, history |

### Android-Specific Features
- Push notifications (Firebase Cloud Messaging)
- Biometric login (fingerprint/face)
- Offline cache for viewed content (AsyncStorage)
- Deep linking for shared URLs

### Android Tech Stack
- React Native (Expo managed workflow)
- React Navigation v6
- Zustand (same as web)
- Axios (same interceptors as web)
- @react-native-firebase/messaging
- expo-local-authentication (biometrics)
- Expo EAS Build (APK/AAB generation)

---

## PART 6: SPRINT PLAN (12 Weeks)

### Sprint 1 (Week 1–2): Foundation

| Agent | Tasks |
|---|---|
| @pm | Finalize PRD in CLAUDE.md, create user stories for Sprint 1–2, set up project repo |
| @backend | Set up Node.js + Express + Prisma + MySQL. Create full schema. Implement auth (register, login, JWT refresh, forgot password). Create seed script. |
| @ui | Create /docs/design-system.md. Define all Tailwind config (colors, fonts). Create component catalog. |
| @frontend | Set up Next.js project. Configure Tailwind + shadcn/ui. Build layout shell (sidebar for admin, bottom nav for user). Build auth pages (login, register, forgot password). |
| @qa | Set up Vitest + Playwright. Write auth API test cases. Create test fixtures. Verify auth flow E2E. |

**Sprint 1 Deliverable:** Working auth system (register → login → dashboard redirect) on both frontend and backend.

### Sprint 2 (Week 3–4): Core Admin Modules

| Agent | Tasks |
|---|---|
| @pm | User stories for admin modules. Priority: users → counsellors → questionnaire. |
| @backend | CRUD APIs: users (list, edit, status toggle), counsellors (CRUD + tags + photo upload), categories, levels, questions. Bulk CSV upload endpoint. |
| @ui | Spec admin pages: data tables, forms, card grids, upload zones. Component-level Tailwind classes. |
| @frontend | Build admin pages: user management (table + search + edit), counsellor management (cards + form), bulk registration (upload zone + history table). |
| @qa | Test all CRUD APIs (happy path + errors). Test CSV upload (valid + invalid data). Test role-based access. |

**Sprint 2 Deliverable:** Admin can manage users, counsellors, and bulk register via CSV.

### Sprint 3 (Week 5–6): Questionnaire + Workshops + Theory

| Agent | Tasks |
|---|---|
| @pm | User stories for questionnaire builder, workshops, theory sessions. |
| @backend | Questionnaire builder API (create quiz, add/remove questions, publish/unpublish). Workshop CRUD. Theory session CRUD + progress tracking. Assessment submission + auto-scoring. |
| @ui | Spec questionnaire builder (4-step flow). Workshop cards + create form. Theory session cards. Assessment attempt UI. |
| @frontend | Build questionnaire builder (category → level → questions → build). Workshop pages (list + create + detail). Theory session pages (list + detail + progress). User-facing assessment flow (question by question with progress bar). |
| @qa | Test full questionnaire flow E2E (admin creates → user attempts → results displayed). Test workshops. Test theory with progress. |

**Sprint 3 Deliverable:** Complete questionnaire system working. Workshops and theory sessions functional.

### Sprint 4 (Week 7–8): Analytics + User Features + Android Start

| Agent | Tasks |
|---|---|
| @pm | User stories for analytics, mood logging, user dashboard. Begin Android app stories. |
| @backend | Analytics endpoints (admin stats + user personal). Mood logging API. CSV export. Query optimization. |
| @ui | Spec analytics charts. User dashboard layout. Begin Android screen adaptations. |
| @frontend | Build admin analytics (charts, KPIs, export). User dashboard (mood, quick actions, upcoming). User analytics (trend chart, category scores). User profile page. **START Android project setup** (Expo init, navigation, auth flow). |
| @qa | Test analytics accuracy. Test CSV export. Full regression on all web features. Begin Android test plan. |

**Sprint 4 Deliverable:** Web app feature-complete. Android project initialized with auth flow.

### Sprint 5 (Week 9–10): Android Core

| Agent | Tasks |
|---|---|
| @pm | Manage parallel web (bug fixes) + Android (core features). |
| @backend | API tweaks for mobile (response size optimization, pagination defaults). FCM push notification endpoints. |
| @ui | Android-specific adjustments. Navigation patterns. Bottom tab specs. |
| @frontend | Build Android: home dashboard, assessment flow, counsellor directory, workshops, theory sessions, analytics, profile. Connect to same production API. |
| @qa | Web: final regression. Android: test on emulator + 2-3 physical devices. |

**Sprint 5 Deliverable:** Android app functional with all user features.

### Sprint 6 (Week 11–12): QA + Polish + Launch

| Agent | Tasks |
|---|---|
| @pm | Final acceptance testing. Prepare Play Store listing. Coordinate with client for hosting setup. |
| @backend | Performance: all endpoints < 200ms. Security: rate limiting, CORS, input sanitization. Production .env setup. |
| @ui | Final design review (web + Android). Fix visual bugs. |
| @frontend | Web: static export, deploy to client hosting. Android: build release APK/AAB, test on devices, submit to Play Store. |
| @qa | Full E2E regression (web + Android). Load test (1000 concurrent simulated). Security scan. Final bug bash. |

**Sprint 6 Deliverable:** Web app live on client hosting. Android app submitted to Play Store.

---

## PART 7: DEPLOYMENT

### Web App → Client's Hosting

**If GoDaddy VPS (recommended):**
1. SSH into VPS, install Node.js 20 + MySQL 8 + PM2 + Nginx
2. Clone repo, `npm install`, set `.env` variables
3. `npx prisma migrate deploy` + `npm run seed`
4. `npm run build` (Next.js static export)
5. Copy `/out` to `/public_html`
6. `pm2 start src/server.js --name mindcare-api`
7. Configure Nginx: reverse proxy `/api/*` → `localhost:3001`
8. `certbot --nginx` for free SSL

**If shared hosting (no Node.js):**
1. Deploy frontend static build to shared hosting `/public_html`
2. Host API on separate server (Oracle free VM or DigitalOcean $5/mo)
3. Frontend calls API via HTTPS to separate domain (api.mindcare.in)

### Android App → Play Store
1. `eas build --platform android` (generates AAB)
2. Create Play Store listing (screenshots, description, privacy policy)
3. Upload AAB → Play Console → Submit for review
4. Configure Firebase project for push
5. Set production API URL in app config

### Environment Variables

```env
# Backend (.env)
DATABASE_URL=mysql://user:pass@localhost:3306/mindcare
JWT_SECRET=generate-a-strong-random-string
JWT_REFRESH_SECRET=generate-another-strong-random-string
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PORT=3001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@mindcare.in
SMTP_PASS=app-password
UPLOAD_DIR=./uploads
CORS_ORIGIN=https://mindcare.in
NODE_ENV=production

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://mindcare.in/api/v1

# Android (app.config.js)
API_URL=https://mindcare.in/api/v1
```

---

## AGENT NOTES (Updated Per Session)

### @pm Notes
- Web app is ONE app with role-based views (USER vs ADMIN)
- Questionnaire hierarchy: Category → Level → Question → Questionnaire (built from questions)
- Client wants bulk CSV upload for users with error reporting
- Analytics must have CSV export for admin

### @ui Notes
- Design system finalized in PART 3 above — follow EXACTLY
- Dark mode is DEFAULT, light mode is secondary
- Mobile-first responsive: 360px → 768px → 1440px
- Use glassmorphism for all cards
- Playfair Display for headings ONLY, DM Sans for everything else

### @frontend Notes
- Use `output: 'export'` in next.config.js for static deployment
- API base from `NEXT_PUBLIC_API_URL` env variable
- Zustand store for auth state (user, tokens, isAuthenticated, isAdmin)
- All API calls go through `/lib/api.ts` with Axios interceptor for token refresh
- Handle loading/success/error states on every page

### @backend Notes
- All routes prefixed with `/api/v1/`
- Response format: `{ success: true/false, data/error, pagination? }`
- Pagination: `?page=1&limit=20` on all list endpoints
- Soft delete everywhere (status: INACTIVE, never hard delete)
- File uploads stored in `./uploads/` directory
- Seed script creates: 1 admin, 5 users, 3 counsellors, 2 categories with levels/questions, 1 questionnaire, 2 workshops, 2 theory sessions

### @qa Notes
- Test accounts: admin@mindcare.com / Admin@123, user@mindcare.com / User@123
- E2E tests in `/tests/e2e/`
- API tests in `/tests/api/`
- Bug tracking in this file under ## BUGS section below
- All bugs must be fixed before sprint completion

---

## BUGS

*None yet. @qa will add bugs here as testing progresses.*

---

## COMPLETED

- [x] PRD finalized (this document)
- [x] UI mockups approved by client (HTML previews delivered)
- [x] Tech stack decided
- [x] Sprint plan created
- [ ] Sprint 1: Foundation (NEXT)
- [ ] Sprint 2: Core Admin
- [ ] Sprint 3: Questionnaire + Workshops + Theory
- [ ] Sprint 4: Analytics + User Features + Android Start
- [ ] Sprint 5: Android Core
- [ ] Sprint 6: QA + Launch

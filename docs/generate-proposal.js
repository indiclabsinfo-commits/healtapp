const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat,
} = require("docx");

const TEAL = "0D9488";
const DARK = "0B0C10";
const GRAY = "666666";
const LIGHT_TEAL = "E6FFFA";
const WHITE = "FFFFFF";

const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun({ text, color: TEAL, bold: true })] });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, color: opts.color || "333333", ...opts })],
  });
}

function spacer() {
  return new Paragraph({ spacing: { after: 200 }, children: [] });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: TEAL },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: TEAL },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    // ===== TITLE PAGE =====
    {
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      children: [
        spacer(), spacer(), spacer(), spacer(), spacer(), spacer(),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: "\uD83E\uDDE0", size: 72 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "MindCare", size: 56, bold: true, font: "Arial", color: TEAL })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
          children: [new TextRun({ text: "B2B2C Counselling & Wellness Platform", size: 24, color: GRAY })] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: TEAL, space: 8 },
                    bottom: { style: BorderStyle.SINGLE, size: 2, color: TEAL, space: 8 } },
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "Business Proposal & Pricing", size: 28, bold: true, color: DARK })] }),
        spacer(), spacer(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prepared by Indic Labs", size: 22, color: GRAY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "March 2026", size: 22, color: GRAY })] }),
      ],
    },

    // ===== MAIN CONTENT =====
    {
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      headers: {
        default: new Header({ children: [
          new Paragraph({ alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "MindCare Business Proposal", size: 16, color: GRAY, italics: true })] }),
        ] }),
      },
      footers: {
        default: new Footer({ children: [
          new Paragraph({
            alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD", space: 4 } },
            children: [
              new TextRun({ text: "MindCare by Indic Labs  |  ", size: 16, color: GRAY }),
              new TextRun({ text: "When you make money, we make money.", size: 16, color: TEAL, italics: true }),
              new TextRun({ text: "  |  Page ", size: 16, color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY }),
            ],
          }),
        ] }),
      },
      children: [
        // === EXECUTIVE SUMMARY ===
        heading("1. Executive Summary"),
        body("MindCare is a complete counselling and wellness platform designed for schools and corporates. It includes a web application (admin + all roles) and an Android mobile app (student/employee). Organizations join via unique codes, members get role-based access, and consultation credits enable free counselling sessions."),
        spacer(),
        body("Key Highlights:", { bold: true, color: DARK }),
        ...["6 roles: Super Admin, Org Admin, Teacher/HR, Student/Employee, Counsellor",
          "Web + Android on a single shared backend",
          "Organization codes for easy onboarding",
          "Credit-based consultation system",
          "Behavior logging and student flagging (for schools)",
          "Assignment system for teachers and HR",
        ].map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: t, size: 22, color: "333333" })] })),

        // === WHEN YOU MAKE MONEY ===
        spacer(),
        heading("2. When You Make Money, We Make Money"),

        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [9360],
          rows: [new TableRow({ children: [new TableCell({
            borders: noBorders, width: { size: 9360, type: WidthType.DXA },
            shading: { fill: LIGHT_TEAL, type: ShadingType.CLEAR }, margins: { top: 200, bottom: 200, left: 240, right: 240 },
            children: [
              new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "This is our core philosophy.", size: 24, bold: true, color: TEAL })] }),
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Our pricing is designed so we only succeed when you succeed. We don\u2019t charge large upfront fees. Our monthly cost scales with YOUR active user count. If your platform isn\u2019t growing, our revenue doesn\u2019t grow.", size: 22, color: "333333" })] }),
              new Paragraph({ children: [new TextRun({ text: "We\u2019re an AI-first company that supports startups \u2014 we build fast, price fair, and partner for the long term.", size: 22, color: "333333" })] }),
            ],
          })] })],
        }),

        spacer(),
        body("Your Business Model:", { bold: true, color: DARK }),
        ...["You charge schools/corporates \u20B9200-500 per student per year",
          "Example: School with 1,000 students \u00D7 \u20B9300/year = \u20B93,00,000/year revenue",
          "You pay us: \u20B910,000 base + (800 \u00D7 \u20B915) = \u20B922,000/month = \u20B92,64,000/year",
          "Your profit from ONE school (Year 2+): \u20B936,000/year",
          "Scale to 10 schools = \u20B93.6L profit. 50 corporates = significantly more.",
        ].map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
          children: [new TextRun({ text: t, size: 22, color: "333333" })] })),

        // === PRICING ===
        new Paragraph({ children: [new PageBreak()] }),
        heading("3. Pricing"),
        body("Simple, transparent pricing. No hidden costs. No surprises."),
        spacer(),

        // Pricing cards as a table
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3120, 3120, 3120],
          rows: [new TableRow({ children: [
            ...[
              { label: "ONE-TIME SETUP", price: "\u20B960,000", desc: "Complete platform build\nWeb + Android + Backend" },
              { label: "MONTHLY BASE", price: "\u20B910,000", desc: "Includes first\n200 active users" },
              { label: "PER USER (ABOVE 200)", price: "\u20B915", desc: "Per active user\nper month" },
            ].map(item => new TableCell({
              borders, width: { size: 3120, type: WidthType.DXA },
              shading: { fill: "F8FFFE", type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 160, right: 160 },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
                  children: [new TextRun({ text: item.label, size: 16, bold: true, color: GRAY })] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
                  children: [new TextRun({ text: item.price, size: 36, bold: true, color: TEAL })] }),
                new Paragraph({ alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: item.desc, size: 18, color: GRAY })] }),
              ],
            })),
          ] })],
        }),

        spacer(),
        body("Why \u20B960,000 instead of \u20B950,000?", { bold: true, color: DARK }),
        body("The original scope was a simple B2C app. The new B2B2C model adds organization codes, 6 role-based access levels, credit management, consultation booking, behavior logging, and assignment system \u2014 8 new database models, 20+ new API endpoints, and 5 new admin panels. The \u20B910,000 increase reflects this expanded scope while keeping the price extremely competitive."),
        spacer(),

        body("Pricing Formula:", { bold: true, color: TEAL }),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { before: 120, after: 200 },
          border: { top: { style: BorderStyle.SINGLE, size: 1, color: TEAL, space: 8 },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: TEAL, space: 8 } },
          children: [new TextRun({ text: "Monthly = \u20B910,000 + (Active Users \u2212 200) \u00D7 \u20B915", size: 24, bold: true, color: DARK })],
        }),

        // Price examples table
        body("Price Examples:", { bold: true, color: DARK }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1872, 1872, 1872, 1872, 1872],
          rows: [
            // Header row
            new TableRow({ children: ["Users", "Base", "User Fee", "Monthly", "Year 1"].map(h =>
              new TableCell({ borders, width: { size: 1872, type: WidthType.DXA },
                shading: { fill: TEAL, type: ShadingType.CLEAR }, margins: cellMargins,
                children: [new Paragraph({ alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: h, size: 20, bold: true, color: WHITE })] })] })) }),
            // Data rows
            ...[
              ["200", "\u20B910,000", "\u20B90", "\u20B910,000", "\u20B91,80,000"],
              ["500", "\u20B910,000", "\u20B94,500", "\u20B914,500", "\u20B92,34,000"],
              ["1,000", "\u20B910,000", "\u20B912,000", "\u20B922,000", "\u20B93,24,000"],
              ["2,000", "\u20B910,000", "\u20B927,000", "\u20B937,000", "\u20B95,04,000"],
              ["5,000", "\u20B910,000", "\u20B972,000", "\u20B982,000", "\u20B910,44,000"],
            ].map((row, i) => new TableRow({ children: row.map(cell =>
              new TableCell({ borders, width: { size: 1872, type: WidthType.DXA },
                shading: { fill: i % 2 === 0 ? "F8FFFE" : WHITE, type: ShadingType.CLEAR }, margins: cellMargins,
                children: [new Paragraph({ alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: cell, size: 20, color: "333333" })] })] })) })),
          ],
        }),
        new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: "Year 1 Total = Setup Fee (\u20B960,000) + Monthly \u00D7 12 months", size: 18, italics: true, color: GRAY })] }),

        spacer(),

        new Table({
          width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
          rows: [new TableRow({ children: [new TableCell({
            borders: noBorders, width: { size: 9360, type: WidthType.DXA },
            shading: { fill: LIGHT_TEAL, type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 240, right: 240 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "\u20B915 per user \u2014 the lowest in the market. ", size: 24, bold: true, color: TEAL }),
                new TextRun({ text: "Most wellness platforms charge \u20B9100-300/user/month. That\u2019s 85-95% less.", size: 22, color: "333333" }),
              ] })] })] })],
        }),

        // === ACTIVE USER DEFINITION ===
        new Paragraph({ children: [new PageBreak()] }),
        heading("4. Active User Definition"),
        body("An active user is any user who:"),
        ...["Logged into the platform at least once during the billing month", "Had an assessment or consultation assigned to them during the month"]
          .map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
            children: [new TextRun({ text: t, size: 22, color: "333333" })] })),
        spacer(),
        body("NOT counted:"),
        ...["Deactivated or suspended accounts", "Users who haven\u2019t logged in that month", "Admin and Super Admin accounts"]
          .map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
            children: [new TextRun({ text: t, size: 22, color: GRAY })] })),
        spacer(),

        new Table({
          width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
          rows: [new TableRow({ children: [new TableCell({
            borders: noBorders, width: { size: 9360, type: WidthType.DXA },
            shading: { fill: LIGHT_TEAL, type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 240, right: 240 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "You only pay for users who actually use the platform. 1,000 registered but only 500 active this month? You pay for 500.", size: 22, bold: true, color: DARK })] })] })] })],
        }),

        // === PLATFORM FEATURES ===
        spacer(),
        heading("5. What\u2019s Included"),
        body("Web Application:", { bold: true, color: TEAL }),
        ...["Complete admin dashboard with real-time analytics", "Organization management with unique codes", "Role-based navigation (6 roles)",
          "Questionnaire builder (4-step: Category \u2192 Level \u2192 Questions \u2192 Build)", "Self-assessment quiz flow with auto-scoring",
          "Guided breathing exercises (5 built-in, animated)", "Theory sessions with module progress tracking",
          "Consultation booking system with credit management", "Behavior logging and student flagging (schools)",
          "Assignment system for teachers and HR", "Analytics and reporting with CSV export", "Dark mode + Light mode, responsive design"]
          .map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 40 },
            children: [new TextRun({ text: t, size: 20, color: "333333" })] })),
        spacer(),
        body("Android Application:", { bold: true, color: TEAL }),
        ...["Same user features as web app", "Animated breathing exercises", "Push notifications for assignments and consultations",
          "Biometric login (fingerprint/face)", "Offline access to viewed content", "Available on Google Play Store"]
          .map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 40 },
            children: [new TextRun({ text: t, size: 20, color: "333333" })] })),
        spacer(),
        body("Backend Infrastructure:", { bold: true, color: TEAL }),
        ...["50+ REST API endpoints", "JWT authentication with refresh tokens", "MySQL database with 20+ models",
          "Rate limiting and security headers", "Role-based access control middleware"]
          .map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 40 },
            children: [new TextRun({ text: t, size: 20, color: "333333" })] })),

        // === MONTHLY SUPPORT ===
        spacer(),
        heading("6. Monthly Support (\u20B910,000/month)"),
        ...["Bug fixes and security updates", "Server monitoring and maintenance (24/7 uptime)", "Email support with 24-48 hour response time",
          "3 hours of technical support included per month", "Platform updates and improvements"]
          .map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 60 },
            children: [new TextRun({ text: t, size: 22, color: "333333" })] })),

        // === TERMS ===
        new Paragraph({ children: [new PageBreak()] }),
        heading("7. Terms & Conditions"),
        ...["Setup fee is due before project commencement", "Monthly fees are billed at the start of each month",
          "Active user count is reviewed monthly based on platform data", "Minimum commitment: 6 months",
          "Cancellation requires 30-day written notice", "Annual prepayment discount: 10% (pay for 11 months, get 12)"]
          .map(t => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 },
            children: [new TextRun({ text: t, size: 22, color: "333333" })] })),

        // === NEXT STEPS ===
        spacer(),
        heading("8. Next Steps"),
        ...["Confirm requirements and approve this proposal", "Sign the service agreement",
          "Process one-time setup fee of \u20B960,000", "Go live \u2014 platform ready within 10 days"]
          .map((t, i) => new Paragraph({ numbering: { reference: "numbers", level: 0 }, spacing: { after: 80 },
            children: [new TextRun({ text: t, size: 22, color: "333333" })] })),

        spacer(), spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 2, color: TEAL, space: 12 },
                    bottom: { style: BorderStyle.SINGLE, size: 2, color: TEAL, space: 12 } },
          spacing: { before: 200, after: 200 },
          children: [
            new TextRun({ text: "When you make money, we make money.\n", size: 28, bold: true, color: TEAL }),
            new TextRun({ text: "That\u2019s how partnerships should work.", size: 22, color: GRAY }),
          ],
        }),
        spacer(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Indic Labs \u00B7 hello@indiclabs.in", size: 22, color: GRAY })] }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/mac/Desktop/healthapp/docs/MindCare_Business_Proposal.docx", buffer);
  console.log("Created MindCare_Business_Proposal.docx");
});

# MindCare Design System

## Philosophy
- Dark-first, premium aesthetic (CRED/Flow inspired)
- Glass morphism cards with blur and subtle borders
- Minimal, clean layouts with generous whitespace
- Typography-driven hierarchy

## Colors

### Dark Mode (Default)
- Background: `#0B0C10` / Body: `#050505`
- Accent: `#6FFFE9` (mint) / `#5BC0BE` (teal)
- Text: `#FFFFFF` / `rgba(255,255,255,0.6)` / `rgba(255,255,255,0.35)`

### Light Mode
- Background: `#FAFBFC` / Body: `#F5F7FA`
- Accent: `#0D9488` (teal) / `#0A7A70`
- Text: `#1A1A2E` / `rgba(0,0,0,0.6)` / `rgba(0,0,0,0.35)`

### Semantic Colors
- Error: `#FF6B6B` | Warning: `#FFD93D` | Success: `#4ADE80` | Purple: `#A78BFA`

## Typography
- Headings: `Playfair Display` (400/600/700)
- Body: `DM Sans` (300/400/500/700)

## Components

### Glass Card
```html
<div class="glass-card p-4">Content</div>
```

### CTA Button
```html
<button class="cta-button">Action</button>
```

### Input Field
```html
<input class="input-field" placeholder="..." />
```

### Tag/Chip
```html
<span class="tag">Label</span>
```

### Filter Pills
```html
<span class="pill-active">Active</span>
<span class="pill-inactive">Inactive</span>
```

## Spacing
- Card radius: 16px | Button radius: 16px | Pill radius: 100px | Input radius: 14px
- Page padding: 20-24px (mobile) / 40px (desktop)
- Card padding: 16-18px | Card gap: 12-14px

## Layouts
- Admin: 240px fixed sidebar + content area
- User: Bottom nav (70px) on mobile, top nav on desktop

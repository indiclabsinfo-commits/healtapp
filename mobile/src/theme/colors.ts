// MindCare Dark Theme - matches web app design system

export const colors = {
  // Backgrounds
  bgPrimary: '#0B0C10',
  bgBody: '#050505',
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.06)',

  // Borders
  borderCard: 'rgba(255,255,255,0.06)',
  borderInput: 'rgba(255,255,255,0.08)',

  // Accents
  accentPrimary: '#6FFFE9',
  accentSecondary: '#5BC0BE',
  accentRed: '#FF6B6B',
  accentYellow: '#FFD93D',
  accentPurple: '#A78BFA',
  accentGreen: '#4ADE80',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.35)',
  textDisabled: 'rgba(255,255,255,0.2)',

  // Gradient endpoints
  gradientStart: '#6FFFE9',
  gradientEnd: '#5BC0BE',

  // Input
  inputBg: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.08)',
  inputFocusBorder: 'rgba(111,255,233,0.3)',

  // Tags / Pills
  tagBg: 'rgba(111,255,233,0.1)',
  tagBorder: 'rgba(111,255,233,0.15)',
  pillActiveBg: 'rgba(111,255,233,0.12)',
  pillActiveBorder: 'rgba(111,255,233,0.25)',

  // Navigation
  navBg: 'rgba(11,12,16,0.95)',

  // Progress
  progressBg: 'rgba(255,255,255,0.06)',

  // CTA button text (dark on gradient)
  ctaText: '#0B0C10',
} as const;

// Glass card style for reuse in StyleSheet.create
export const glassCard = {
  backgroundColor: colors.bgCard,
  borderWidth: 1,
  borderColor: colors.borderCard,
  borderRadius: 16,
} as const;

// Gradient colors for LinearGradient
export const gradientColors: [string, string] = [colors.gradientStart, colors.gradientEnd];

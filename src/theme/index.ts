/** Design tokens. Every colour pair used for text meets WCAG AA (checked in theme.test.ts). */
export const colors = {
  background: '#F7F3F1',
  surface: '#FFFFFF',
  surfaceMuted: '#F0E9E6',
  border: '#E5DCD7',
  text: '#241D1B',
  textMuted: '#6B5E59',
  primary: '#8B3A62',
  primaryPressed: '#732F51',
  primaryText: '#FFFFFF',
  primarySoft: '#F4E7EE',
  danger: '#B3261E',
  dangerSoft: '#FBEAE8',
  success: '#2A7048',
  successSoft: '#E4F2EA',
  warning: '#8F5400',
  warningSoft: '#FCEFD9',
  neutralSoft: '#ECE6E3',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 18, pill: 999 } as const;

/** Large touch targets: the app is used with a measuring tape in hand. */
export const MIN_TOUCH = 48;

export const font = {
  caption: 12,
  small: 13,
  body: 16,
  title: 18,
  heading: 24,
  display: 30,
} as const;

/** Soft, cross-platform shadows (React Native's boxShadow works on Android, iOS and web). */
export const shadow = {
  card: '0px 1px 2px rgba(36, 29, 27, 0.06), 0px 2px 8px rgba(36, 29, 27, 0.04)',
  raised: '0px 4px 14px rgba(36, 29, 27, 0.22)',
} as const;

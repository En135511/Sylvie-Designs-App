export const colors = {
  background: '#FAF7F5',
  surface: '#FFFFFF',
  border: '#E6DED8',
  text: '#2B2321',
  textMuted: '#7A6E69',
  primary: '#8B3A62',
  primaryText: '#FFFFFF',
  danger: '#B3261E',
  success: '#2E7D4F',
  warning: '#B26A00',
  chip: '#F1E8EE',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 12, pill: 999 } as const;
/** Large touch targets: the app is used with measuring tape in hand. */
export const MIN_TOUCH = 48;

export const font = { body: 16, small: 13, title: 20, heading: 26 } as const;

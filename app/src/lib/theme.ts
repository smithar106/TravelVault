export const Colors = {
  primary: '#0D6B6B',
  primaryLight: '#E8F5F5',
  primaryDark: '#0A5050',
  accent: '#F5A623',
  accentLight: '#FFF3E0',
  background: '#FAFAFA',
  white: '#FFFFFF',
  text: '#222222',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#F5A623',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '800' as const, color: Colors.text },
  h2: { fontSize: 24, fontWeight: '700' as const, color: Colors.text },
  h3: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  body: { fontSize: 15, color: Colors.textSecondary },
  caption: { fontSize: 13, color: Colors.textTertiary },
  small: { fontSize: 12, color: Colors.textTertiary },
};

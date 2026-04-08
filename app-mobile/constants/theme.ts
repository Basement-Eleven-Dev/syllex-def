// Design tokens matching the Syllex web frontend palette
export const Colors = {
  primary: "#4F46E5", // Indigo-600
  primaryDark: "#3730A3", // Indigo-800
  primaryLight: "#818CF8", // Indigo-400
  primarySurface: "#EEF2FF", // Indigo-50

  secondary: "#06B6D4", // Cyan-500
  secondaryLight: "#CFFAFE",

  success: "#10B981", // Emerald-500
  successLight: "#D1FAE5",
  warning: "#F59E0B", // Amber-500
  warningLight: "#FEF3C7",
  danger: "#EF4444", // Red-500
  dangerLight: "#FEE2E2",

  // Neutrals
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  white: "#FFFFFF",
  black: "#000000",

  // Semantic
  background: "#F9FAFB",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textDisabled: "#9CA3AF",
} as const;

export const Typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    semibold: "System",
    bold: "System",
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    "2xl": 26,
    "3xl": 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

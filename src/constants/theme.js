// Legacy theme constants — kept for backward compatibility.
// For dynamic light/dark theming, use `useTheme()` from ../context/ThemeContext.

export const COLORS = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#DBEAFE",
  secondary: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  white: "#FFFFFF",
  black: "#1F2937",
  gray: "#6B7280",
  grayLight: "#F3F4F6",
  grayBorder: "#E5E7EB",
  background: "#F9FAFB",
};

export const FONTS = {
  regular: { fontSize: 14, color: COLORS.black },
  medium: { fontSize: 16, fontWeight: "500", color: COLORS.black },
  bold: { fontSize: 16, fontWeight: "700", color: COLORS.black },
  h1: { fontSize: 24, fontWeight: "700", color: COLORS.black },
  h2: { fontSize: 20, fontWeight: "600", color: COLORS.black },
  h3: { fontSize: 18, fontWeight: "600", color: COLORS.black },
  small: { fontSize: 12, color: COLORS.gray },
};

export const SIZES = {
  padding: 16,
  radius: 12,
  inputHeight: 48,
};

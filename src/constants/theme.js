// Legacy theme constants — kept for backward compatibility with screens that
// import COLORS/FONTS/SIZES directly. These now derive from the single token
// source (src/theme/tokens.js) so they can never drift from the live theme.
// For dynamic light/dark theming, prefer `useTheme()` from ../context/ThemeContext.

import { palette, spacing, radius, typography } from "../theme/tokens";

const l = palette.light;

export const COLORS = {
  primary: l.primary,
  primaryDark: l.primaryDark,
  primaryLight: l.primaryLight,
  secondary: l.secondary,
  danger: l.danger,
  warning: l.warning,
  white: "#FFFFFF",
  black: l.text,
  gray: l.textSecondary,
  grayLight: l.grayLight,
  grayBorder: l.border,
  background: l.background,
};

export const FONTS = {
  regular: { fontSize: typography.body.fontSize, color: COLORS.black },
  medium: { ...typography.bodyStrong, color: COLORS.black },
  bold: { fontSize: 16, fontWeight: "700", color: COLORS.black },
  h1: { ...typography.h1, color: COLORS.black },
  h2: { ...typography.h2, color: COLORS.black },
  h3: { ...typography.h3, color: COLORS.black },
  small: { ...typography.caption, color: COLORS.gray },
};

export const SIZES = {
  padding: spacing.lg,
  radius: radius.md,
  inputHeight: 48,
};

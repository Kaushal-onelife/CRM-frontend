// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — the single source of truth for the whole app.
//
// Everything visual flows from here:
//   • ThemeContext consumes `palette` for runtime light/dark `colors`.
//   • tailwind.config.js imports `palette` so className colors never drift.
//   • defaults.js / components consume `spacing`, `radius`, `typography`, `shadow`.
//
// Rule of thumb: never hardcode a hex, a px gap, or a radius in a screen again.
// Add it here as a token, then reference the token.
// ─────────────────────────────────────────────────────────────────────────────

// Raw color ramps — the only place hex values live.
const ramp = {
  // Brand — a friendlier, slightly richer blue than the old flat #2563EB.
  blue: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    200: "#BFDBFE",
    400: "#60A5FA",
    500: "#3B82F6",
    600: "#2563EB",
    700: "#1D4ED8",
  },
  green: { 50: "#ECFDF5", 100: "#D1FAE5", 500: "#10B981", 600: "#059669", 400: "#34D399" },
  amber: { 50: "#FFFBEB", 100: "#FEF3C7", 500: "#F59E0B", 400: "#FBBF24" },
  orange: { 50: "#FFF7ED", 500: "#F97316", 400: "#FB923C" },
  red: { 50: "#FEF2F2", 100: "#FEE2E2", 500: "#EF4444", 400: "#F87171" },
  violet: { 50: "#F5F3FF", 500: "#8B5CF6", 400: "#A78BFA" },
  // Neutral ramp — used for text, surfaces, borders.
  slate: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E5E7EB",
    300: "#CBD5E1",
    400: "#9CA3AF",
    500: "#6B7280",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  // Deep neutrals for dark mode surfaces (slightly blue-tinted = modern, not muddy).
  ink: {
    bg: "#0F1115",
    surface: "#171A21",
    card: "#1E222B",
    cardElevated: "#262B36",
    border: "#2D333F",
  },
  white: "#FFFFFF",
  black: "#000000",
};

// Semantic palette — what the UI actually references. Keyed by theme.
// Add a NEW key here and it's instantly available via useTheme().colors.<key>.
export const palette = {
  light: {
    primary: ramp.blue[600],
    primaryDark: ramp.blue[700],
    primaryLight: ramp.blue[100],
    primarySoft: ramp.blue[50],
    onPrimary: ramp.white,

    secondary: ramp.green[500],
    success: ramp.green[500],
    successSoft: ramp.green[50],
    warning: ramp.amber[500],
    warningSoft: ramp.amber[50],
    danger: ramp.red[500],
    dangerSoft: ramp.red[50],
    info: ramp.blue[500],
    accent: ramp.violet[500],

    background: ramp.slate[50],
    surface: ramp.white,
    card: ramp.white,
    cardElevated: ramp.white,

    text: ramp.slate[800],
    textSecondary: ramp.slate[500],
    textMuted: ramp.slate[400],
    border: ramp.slate[200],
    divider: ramp.slate[100],

    // legacy aliases (so existing screens keep working)
    gray: ramp.slate[500],
    grayLight: ramp.slate[100],
  },
  dark: {
    primary: ramp.blue[500],
    primaryDark: ramp.blue[600],
    primaryLight: "#1E3A5F",
    primarySoft: "#172554",
    onPrimary: ramp.white,

    secondary: ramp.green[400],
    success: ramp.green[400],
    successSoft: "#064E3B",
    warning: ramp.amber[400],
    warningSoft: "#422006",
    danger: ramp.red[400],
    dangerSoft: "#450A0A",
    info: ramp.blue[400],
    accent: ramp.violet[400],

    background: ramp.ink.bg,
    surface: ramp.ink.surface,
    card: ramp.ink.card,
    cardElevated: ramp.ink.cardElevated,

    text: "#E7EAF0",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",
    border: ramp.ink.border,
    divider: ramp.ink.border,

    gray: "#9CA3AF",
    grayLight: ramp.ink.border,
  },
};

// Status colors used by ServiceCard etc. — one definition, both themes.
export const statusColors = {
  upcoming: { fg: ramp.blue[600], soft: ramp.blue[50], softDark: "#1E3A5F" },
  due: { fg: ramp.orange[500], soft: ramp.orange[50], softDark: "#431407" },
  pending: { fg: ramp.amber[500], soft: ramp.amber[50], softDark: "#422006" },
  completed: { fg: ramp.green[500], soft: ramp.green[50], softDark: "#064E3B" },
  rejected: { fg: ramp.red[500], soft: ramp.red[50], softDark: "#450A0A" },
  followup: { fg: ramp.violet[500], soft: ramp.violet[50], softDark: "#2E1065" },
};

// 4px spacing scale — consistent rhythm everywhere.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 999,
};

export const typography = {
  display: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  h1: { fontSize: 24, fontWeight: "700", letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: "700", letterSpacing: -0.2 },
  h3: { fontSize: 17, fontWeight: "600" },
  body: { fontSize: 15, fontWeight: "400" },
  bodyStrong: { fontSize: 15, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "500" },
  caption: { fontSize: 12, fontWeight: "400" },
};

// Elevation presets — theme-aware shadow helper.
export const shadow = (isDark, level = "md") => {
  const map = {
    sm: { h: 1, blur: 3, op: isDark ? 0.3 : 0.05, e: 1 },
    md: { h: 2, blur: 8, op: isDark ? 0.35 : 0.08, e: 3 },
    lg: { h: 4, blur: 16, op: isDark ? 0.4 : 0.12, e: 6 },
  };
  const s = map[level] || map.md;
  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: s.h },
    shadowOpacity: s.op,
    shadowRadius: s.blur,
    elevation: s.e,
  };
};

export const TOUCH_TARGET = 48;

export { ramp };

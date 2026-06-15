/** @type {import('tailwindcss').Config} */
// Colors are imported from the single token source so className utilities and
// the runtime theme can never drift apart. Dark variants resolve via `dark:` +
// darkMode "class" (NativeWind toggles the class from the system/app theme).
const { palette, spacing, radius } = require("./src/theme/tokens");

const l = palette.light;
const d = palette.dark;

module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: l.primary, dark: l.primaryDark, light: l.primaryLight },
        secondary: { DEFAULT: l.secondary },
        success: { DEFAULT: l.success },
        warning: { DEFAULT: l.warning },
        danger: { DEFAULT: l.danger },
        accent: { DEFAULT: l.accent },
        surface: { light: l.surface, dark: d.surface },
        background: { light: l.background, dark: d.background },
        card: { light: l.card, dark: d.card },
        text: { light: l.text, dark: d.text },
        "text-secondary": { light: l.textSecondary, dark: d.textSecondary },
        border: { light: l.border, dark: d.border },
      },
      spacing,
      borderRadius: radius,
    },
  },
  plugins: [],
};

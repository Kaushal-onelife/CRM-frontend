/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#DBEAFE",
        },
        secondary: {
          DEFAULT: "#10B981",
        },
        danger: {
          DEFAULT: "#EF4444",
        },
        warning: {
          DEFAULT: "#F59E0B",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#1E1E2E",
        },
        background: {
          light: "#F9FAFB",
          dark: "#121218",
        },
        card: {
          light: "#FFFFFF",
          dark: "#252536",
        },
        text: {
          light: "#1F2937",
          dark: "#E5E7EB",
        },
        "text-secondary": {
          light: "#6B7280",
          dark: "#9CA3AF",
        },
        border: {
          light: "#E5E7EB",
          dark: "#374151",
        },
      },
    },
  },
  plugins: [],
};

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
          DEFAULT: "rgb(var(--color-primary))",
          dark: "rgb(var(--color-primary-dark))",
          light: "rgb(var(--color-primary-light))",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary))",
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger))",
        },
        warning: {
          DEFAULT: "rgb(var(--color-warning))",
        },
        background: {
          DEFAULT: "rgb(var(--color-background))",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface))",
        },
        card: {
          DEFAULT: "rgb(var(--color-card))",
        },
        text: {
          DEFAULT: "rgb(var(--color-text))",
          secondary: "rgb(var(--color-text-secondary))",
        },
        border: {
          DEFAULT: "rgb(var(--color-border))",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};

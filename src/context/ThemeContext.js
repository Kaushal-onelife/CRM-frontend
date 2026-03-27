import React, { createContext, useContext, useState, useCallback } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "@app_theme";

const ThemeContext = createContext({
  isDark: false,
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
  colors: {},
});

const lightColors = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#DBEAFE",
  secondary: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  background: "#F9FAFB",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  gray: "#6B7280",
  grayLight: "#F3F4F6",
};

const darkColors = {
  primary: "#3B82F6",
  primaryDark: "#2563EB",
  primaryLight: "#1E3A5F",
  secondary: "#34D399",
  danger: "#F87171",
  warning: "#FBBF24",
  background: "#121218",
  surface: "#1E1E2E",
  card: "#252536",
  text: "#E5E7EB",
  textSecondary: "#9CA3AF",
  border: "#374151",
  gray: "#9CA3AF",
  grayLight: "#374151",
};

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState(systemScheme || "light");

  React.useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved) setThemeState(saved);
    });
  }, []);

  const isDark = theme === "dark";
  const colors = isDark ? darkColors : lightColors;

  const setTheme = useCallback(async (newTheme) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem(THEME_KEY, newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { lightColors, darkColors };
export default ThemeContext;

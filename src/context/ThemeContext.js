import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { palette, spacing, radius, typography, shadow } from "../theme/tokens";

const THEME_KEY = "@app_theme";

const ThemeContext = createContext({
  isDark: false,
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
  colors: {},
});

// Colors now come from the single token source (src/theme/tokens.js).
const lightColors = palette.light;
const darkColors = palette.dark;

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

  const value = useMemo(
    () => ({
      isDark,
      theme,
      toggleTheme,
      setTheme,
      colors,
      spacing,
      radius,
      typography,
      // theme-aware elevation: const { elevation } = useTheme(); style={elevation("lg")}
      elevation: (level) => shadow(isDark, level),
    }),
    [isDark, theme, toggleTheme, setTheme, colors]
  );

  return (
    <ThemeContext.Provider value={value}>
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

import { StyleSheet } from "react-native";
import { SIZES } from "../constants/theme";

// Theme-aware shared style presets.
// Usage:
//   const { colors } = useTheme();
//   const styles = useMemo(() => createDefaultStyles(colors), [colors]);
//   ...
//   <View style={[styles.container]}>
//     <View style={styles.card}>...</View>
//   </View>
//
// Compose with screen-specific styles via array syntax: style={[styles.card, { marginTop: 8 }]}
// so duplicated card/container/input/button rules don't need to be re-declared per screen.

export const TOUCH_TARGET = 48;

export function createDefaultStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    screenPadding: {
      paddingHorizontal: SIZES.padding,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius,
      padding: SIZES.padding,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    bodyText: {
      fontSize: 14,
      color: colors.text,
    },
    mutedText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    emptyText: {
      textAlign: "center",
      color: colors.textSecondary,
      paddingVertical: 32,
      fontSize: 14,
    },
    input: {
      height: SIZES.inputHeight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: SIZES.radius,
      paddingHorizontal: 14,
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: 15,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.textSecondary,
      marginBottom: 6,
    },
    button: {
      minHeight: TOUCH_TARGET,
      borderRadius: SIZES.radius,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    buttonSecondary: {
      minHeight: TOUCH_TARGET,
      borderRadius: SIZES.radius,
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    buttonSecondaryText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    iconButton: {
      minWidth: TOUCH_TARGET,
      minHeight: TOUCH_TARGET,
      alignItems: "center",
      justifyContent: "center",
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    fabText: {
      color: "#FFFFFF",
      fontSize: 28,
      lineHeight: 30,
      fontWeight: "300",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  });
}

// Convenience hook — pairs with useTheme():
//   const styles = useDefaultStyles();
import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

export function useDefaultStyles() {
  const { colors } = useTheme();
  return useMemo(() => createDefaultStyles(colors), [colors]);
}

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

// Lightweight in-app toast — non-blocking success/error/info messages that slide
// in from the top and auto-dismiss. Built on Reanimated + theme tokens, no deps.
//
// Usage:
//   const toast = useToast();
//   toast.success("Bill created");
//   toast.error("Couldn't save");
//   toast.show("Heads up", { type: "info" });

const ToastContext = createContext({
  show: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

// Module-level ref so non-hook code (or convenience) can trigger toasts too.
let externalShow = null;

const TYPES = {
  success: { icon: "check-circle", color: "#10B981", soft: "#ECFDF5", softDark: "#064E3B" },
  error: { icon: "alert-circle", color: "#EF4444", soft: "#FEF2F2", softDark: "#450A0A" },
  info: { icon: "information", color: "#2E9BE6", soft: "#EFF6FF", softDark: "#172554" },
};

function ToastView({ toast }) {
  const { colors, isDark, radius, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const cfg = TYPES[toast.type] || TYPES.info;

  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(180)}
      pointerEvents="none"
      style={[
        styles.toast,
        {
          top: insets.top + 8,
          backgroundColor: colors.card,
          borderLeftColor: cfg.color,
          borderRadius: radius.md,
        },
        elevation("lg"),
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: isDark ? cfg.softDark : cfg.soft },
        ]}
      >
        <MaterialCommunityIcons name={cfg.icon} size={18} color={cfg.color} />
      </View>
      <Text style={[styles.msg, { color: colors.text }]} numberOfLines={3}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const show = useCallback((message, opts = {}) => {
    if (!message) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type: opts.type || "info", id: Date.now() });
    timerRef.current = setTimeout(() => setToast(null), opts.duration || 3000);
  }, []);

  // Expose for the module-level singleton.
  externalShow = show;

  const api = {
    show,
    success: useCallback((m, o) => show(m, { ...o, type: "success" }), [show]),
    error: useCallback((m, o) => show(m, { ...o, type: "error" }), [show]),
    info: useCallback((m, o) => show(m, { ...o, type: "info" }), [show]),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? <ToastView key={toast.id} toast={toast} /> : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// Convenience singleton for code outside React components. Prefer useToast()
// inside components; this is a fallback.
export const toast = {
  success: (m, o) => externalShow?.(m, { ...o, type: "success" }),
  error: (m, o) => externalShow?.(m, { ...o, type: "error" }),
  info: (m, o) => externalShow?.(m, { ...o, type: "info" }),
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    zIndex: 9999,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  msg: { flex: 1, fontSize: 14, fontWeight: "500" },
});

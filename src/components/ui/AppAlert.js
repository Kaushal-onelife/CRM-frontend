import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

// Branded in-app alert/dialog — replaces the OS system Alert (and the web
// window.confirm hack) with a themed modal that looks the same on iOS, Android
// and web. Imperative API so it drops in wherever Alert.alert / confirm() was.
//
// Usage (via the alert singleton, after mounting AppAlertProvider):
//   import { alert } from "../../components/ui";
//   alert.show({ title, message });                       // info, single OK
//   alert.confirm({ title, message, confirmText, destructive, onConfirm });

const AppAlertContext = createContext(null);

// Module-level bridge so non-hook code can call it.
let externalShow = null;

const ICONS = {
  info: { name: "information", color: "info" },
  success: { name: "check-circle", color: "success" },
  warning: { name: "alert", color: "warning" },
  error: { name: "alert-circle", color: "danger" },
  confirm: { name: "help-circle", color: "primary" },
};

export function AppAlertProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);

  const close = useCallback(() => setDialog(null), []);

  // Generic opener. opts: { title, message, tone, buttons: [{text, style, onPress}] }
  const open = useCallback((opts) => {
    setDialog(opts);
  }, []);

  externalShow = open;

  const api = {
    // Info / acknowledge dialog (single OK button by default).
    show: (opts) =>
      open({
        tone: opts.tone || "info",
        title: opts.title,
        message: opts.message,
        buttons: opts.buttons || [{ text: opts.okText || "OK", style: "primary" }],
      }),
    // Yes/No confirmation.
    confirm: (opts) =>
      open({
        tone: opts.destructive ? "warning" : "confirm",
        title: opts.title,
        message: opts.message,
        buttons: [
          { text: opts.cancelText || "Cancel", style: "cancel", onPress: opts.onCancel },
          {
            text: opts.confirmText || "Confirm",
            style: opts.destructive ? "destructive" : "primary",
            onPress: opts.onConfirm,
          },
        ],
      }),
  };

  return (
    <AppAlertContext.Provider value={api}>
      {children}
      <AlertModal dialog={dialog} onClose={close} />
    </AppAlertContext.Provider>
  );
}

function AlertModal({ dialog, onClose }) {
  const { colors, radius, elevation } = useTheme();
  if (!dialog) return null;

  const iconCfg = ICONS[dialog.tone] || ICONS.info;
  const iconColor = colors[iconCfg.color] || colors.primary;
  const iconSoft =
    dialog.tone === "warning" || dialog.tone === "error"
      ? colors.dangerSoft
      : dialog.tone === "success"
      ? colors.successSoft
      : colors.primarySoft;

  const handlePress = (btn) => {
    onClose();
    // Run the action after the modal closes so navigation/toasts feel snappy.
    if (btn.onPress) setTimeout(() => btn.onPress(), 0);
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)} style={styles.backdrop}>
        {/* Tap outside dismisses (acts as cancel). */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={ZoomIn.duration(180)}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderRadius: radius.xl },
            elevation("lg"),
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: iconSoft }]}>
            <MaterialCommunityIcons name={iconCfg.name} size={28} color={iconColor} />
          </View>

          {dialog.title ? (
            <Text style={[styles.title, { color: colors.text }]}>{dialog.title}</Text>
          ) : null}
          {dialog.message ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>{dialog.message}</Text>
          ) : null}

          <View style={[styles.buttons, dialog.buttons.length > 2 && styles.buttonsStacked]}>
            {dialog.buttons.map((btn, i) => {
              const isPrimary = btn.style === "primary";
              const isDestructive = btn.style === "destructive";
              const isCancel = btn.style === "cancel";
              const bg = isDestructive ? colors.danger : isPrimary ? colors.primary : "transparent";
              const fg = isCancel ? colors.textSecondary : isDestructive || isPrimary ? colors.onPrimary : colors.text;
              return (
                <Pressable
                  key={i}
                  onPress={() => handlePress(btn)}
                  style={({ pressed }) => [
                    styles.btn,
                    {
                      backgroundColor: bg,
                      borderColor: colors.border,
                      borderWidth: isCancel ? 1 : 0,
                      borderRadius: radius.md,
                      opacity: pressed ? 0.8 : 1,
                      flex: dialog.buttons.length > 2 ? undefined : 1,
                    },
                  ]}
                >
                  <Text style={{ color: fg, fontWeight: "600", fontSize: 15 }}>{btn.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export function useAppAlert() {
  const ctx = useContext(AppAlertContext);
  if (!ctx) throw new Error("useAppAlert must be used within AppAlertProvider");
  return ctx;
}

// Singleton for use anywhere (including utils like confirm.js).
export const alert = {
  show: (opts) =>
    externalShow?.({
      tone: opts.tone || "info",
      title: opts.title,
      message: opts.message,
      buttons: opts.buttons || [{ text: opts.okText || "OK", style: "primary" }],
    }),
  confirm: (opts) =>
    externalShow?.({
      tone: opts.destructive ? "warning" : "confirm",
      title: opts.title,
      message: opts.message,
      buttons: [
        { text: opts.cancelText || "Cancel", style: "cancel", onPress: opts.onCancel },
        {
          text: opts.confirmText || "Confirm",
          style: opts.destructive ? "destructive" : "primary",
          onPress: opts.onConfirm,
        },
      ],
    }),
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: 22,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  message: { fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: 20 },
  buttons: { flexDirection: "row", gap: 10, width: "100%" },
  buttonsStacked: { flexDirection: "column-reverse" },
  btn: { paddingVertical: 12, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
});

import { Alert, Platform } from "react-native";

// Cross-platform confirm dialog.
// React Native's Alert.alert with multiple buttons does NOT render on
// react-native-web (browser), so confirmations silently no-op there. This uses
// the browser's window.confirm on web and Alert.alert on native.
//
// Usage:
//   confirm({
//     title: "Logout",
//     message: "Are you sure you want to logout?",
//     confirmText: "Logout",
//     destructive: true,
//     onConfirm: () => { ... },
//   });
export function confirm({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}) {
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-undef
    const ok = window.confirm(message ? `${title}\n\n${message}` : title);
    if (ok) onConfirm?.();
    else onCancel?.();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: "cancel", onPress: () => onCancel?.() },
    {
      text: confirmText,
      style: destructive ? "destructive" : "default",
      onPress: () => onConfirm?.(),
    },
  ]);
}

import { alert } from "../components/ui/AppAlert";

// Cross-platform confirm dialog — now backed by the branded in-app AppAlert
// (themed modal that works identically on iOS, Android and web). Keeps the same
// API so existing callers don't change.
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
  alert.confirm({
    title,
    message,
    confirmText,
    cancelText,
    destructive,
    onConfirm,
    onCancel,
  });
}

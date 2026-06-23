import { Platform } from "react-native";
import { onlineManager } from "@tanstack/react-query";
import { alert } from "../components/ui/AppAlert";

// Guard for write actions while Phase-1 (read-only offline) is in place.
// Returns true if online; if offline, shows a clear message and returns false.
// Usage at the top of a submit handler:
//   if (!requireOnline()) return;
export function requireOnline(
  message = "You're offline. Reconnect to the internet to save this."
) {
  // On web, NetInfo connectivity detection is unreliable (often reports offline
  // even when connected), so don't gate writes there — trust the browser. The
  // offline guard is meant for the native field-app scenario.
  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      alert.show({ tone: "warning", title: "You're offline", message });
      return false;
    }
    return true;
  }

  if (onlineManager.isOnline()) return true;
  alert.show({ tone: "warning", title: "You're offline", message });
  return false;
}

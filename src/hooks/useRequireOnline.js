import { Alert } from "react-native";
import { onlineManager } from "@tanstack/react-query";

// Guard for write actions while Phase-1 (read-only offline) is in place.
// Returns true if online; if offline, shows a clear message and returns false.
// Usage at the top of a submit handler:
//   if (!requireOnline()) return;
export function requireOnline(
  message = "You're offline. Reconnect to the internet to save this."
) {
  if (onlineManager.isOnline()) return true;
  Alert.alert("You're offline", message);
  return false;
}

import { useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";

// Subscribe to React Query's online state (fed by NetInfo in App.js).
// Returns true when connected, false when offline.
export function useOnline() {
  return useSyncExternalStore(
    (cb) => onlineManager.subscribe(cb),
    () => onlineManager.isOnline(),
    () => true
  );
}

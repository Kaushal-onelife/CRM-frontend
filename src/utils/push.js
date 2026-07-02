// Push notification registration for staff devices.
//
// IMPORTANT: Expo push tokens only work in a DEVELOPMENT/PRODUCTION BUILD on a
// real device — NOT in Expo Go and NOT on an emulator. In those cases this
// returns null and the app continues normally (in-app Reminder Center still works).
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

// How a notification behaves when it arrives while the app is FOREGROUNDED.
// Show the banner + play sound so staff notice even with the app open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Read the EAS projectId from app config — required by getExpoPushTokenAsync in
// SDK 49+. It's already set under expo.extra.eas.projectId in app.json.
function getProjectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    null
  );
}

// Requests permission and returns this device's Expo push token, or null if
// unavailable (denied, emulator, Expo Go, or misconfigured). Safe to call on
// every launch — the OS caches the grant and the token is stable per install.
export async function registerForPushNotifications() {
  // Real hardware only — emulators/simulators can't receive push.
  if (!Device.isDevice) {
    console.log("[push] not a physical device; skipping push registration.");
    return null;
  }

  // Android requires explicit channels. We create three so users can tune each
  // category independently in system settings, and so priority is honored:
  //   high    — money & urgent (payments, overdue) → heads-up + sound
  //   default — operational (services, AMC, reminders) → normal
  //   low     — confirmations (service done, bill created) → quiet
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("high", {
      name: "Important (money & urgent)",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563EB",
    });
    await Notifications.setNotificationChannelAsync("default", {
      name: "Updates",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
      lightColor: "#2563EB",
    });
    await Notifications.setNotificationChannelAsync("low", {
      name: "Confirmations",
      importance: Notifications.AndroidImportance.LOW,
      lightColor: "#2563EB",
    });
  }

  // Ask for permission only if not already granted.
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== "granted") {
    console.log("[push] permission not granted; skipping.");
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.warn("[push] no EAS projectId found; cannot get push token.");
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token; // "ExponentPushToken[...]"
  } catch (e) {
    console.warn("[push] failed to get Expo push token:", e?.message || e);
    return null;
  }
}

// Subscribe to notification taps. `onTap(data)` receives the notification's
// data payload (e.g. { screen: "Reminders" }). Returns an unsubscribe function.
// Also fires for a tap that COLD-STARTED the app (getLastNotificationResponseAsync).
export function addNotificationTapListener(onTap) {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    onTap(response?.notification?.request?.content?.data || {});
  });

  // Handle the case where a tap launched the app from a killed state.
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      onTap(response.notification?.request?.content?.data || {});
    }
  });

  return () => sub.remove();
}

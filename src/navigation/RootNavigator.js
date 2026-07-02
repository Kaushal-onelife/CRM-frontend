import React, { useState, useEffect, useRef } from "react";
import { View } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { supabase } from "../services/supabase";
import { queryClient } from "../services/queryClient";
import { pushAPI } from "../services/api";
import { registerForPushNotifications, addNotificationTapListener } from "../utils/push";
import { navigateToDeepLink } from "../utils/notificationNav";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import { useTheme } from "../context/ThemeContext";
import { SkeletonList, OfflineBanner } from "../components/ui";

export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigationRef = useRef(null);

  // Route a tapped notification's deep_link to the right screen. Falls back to
  // the Notification Center if the payload has no usable target.
  const handleDeepLink = (data) => {
    const nav = navigationRef.current;
    if (!nav) return;
    if (data && data.screen) {
      navigateToDeepLink(nav, data);
    } else {
      nav.navigate("More", { screen: "Notifications" });
    }
  };

  useEffect(() => {
    let settled = false;
    const finish = (s) => {
      if (settled) return;
      settled = true;
      setSession(s);
      setLoading(false);
    };

    // Safety net: getSession() can hang offline (it may attempt a network token
    // refresh that never resolves), leaving the app stuck on the loading screen.
    // After 2.5s, fall back to reading the persisted session DIRECTLY from
    // AsyncStorage (instant, local, no network) so a logged-in user still gets in.
    const timer = setTimeout(async () => {
      try {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;
        const keys = await AsyncStorage.getAllKeys();
        const authKey = keys.find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
        const raw = authKey ? await AsyncStorage.getItem(authKey) : null;
        const stored = raw ? JSON.parse(raw) : null;
        // Supabase stores the session object (with access_token) under that key.
        finish(stored?.access_token ? stored : stored?.currentSession || null);
      } catch (e) {
        finish(null);
      }
    }, 2500);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => finish(session))
      .catch((error) => {
        console.error("getSession failed:", error?.message || error);
        finish(null);
      })
      .finally(() => clearTimeout(timer));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only drop to the login screen on an explicit sign-out. A null session
      // from a failed token refresh while OFFLINE must NOT log the user out —
      // otherwise they get stranded at Login (which needs network) and lose
      // access to their cached/offline data.
      if (event === "SIGNED_OUT") {
        setSession(null);
        // Clear cached data so the next user can't see the previous user's
        // persisted queries (the offline cache survives across sessions).
        queryClient.clear();
      } else if (session) {
        setSession(session);
      }
      // else: keep the existing session (transient offline refresh failure)
    });

    return () => subscription.unsubscribe();
  }, []);

  // Register this device for push once the user is logged in. Runs when a
  // session appears (login or app-start with a stored session). Failures are
  // swallowed — push is a bonus; the in-app Reminder Center works regardless.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (token && !cancelled) {
          await pushAPI.saveToken(token);
        }
      } catch (e) {
        console.log("[push] registration skipped:", e?.message || e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Route notification taps to their deep-link target. Mounted once.
  useEffect(() => {
    const unsubscribe = addNotificationTapListener((data) => handleDeepLink(data));
    return unsubscribe;
  }, []);

  // Drive React Navigation's own theme from our tokens so headers, card
  // backgrounds, and the container respond to light/dark automatically.
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: 16, justifyContent: "center" }}>
        <SkeletonList count={5} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      {/* Banner renders inline only when offline; when online it returns null and
          takes no space, so the navigator's own safe-area handling is untouched. */}
      <OfflineBanner topInset />
      <View style={{ flex: 1 }}>
        {session ? <AppNavigator /> : <AuthNavigator />}
      </View>
    </NavigationContainer>
  );
}

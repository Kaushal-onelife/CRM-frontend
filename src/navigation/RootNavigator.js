import React, { useState, useEffect } from "react";
import { View } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { supabase } from "../services/supabase";
import { queryClient } from "../services/queryClient";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import { useTheme } from "../context/ThemeContext";
import { SkeletonList, OfflineBanner } from "../components/ui";

export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch((error) => {
        console.error("getSession failed:", error?.message || error);
        setSession(null);
      })
      .finally(() => setLoading(false));

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
    <NavigationContainer theme={navTheme}>
      {/* Banner renders inline only when offline; when online it returns null and
          takes no space, so the navigator's own safe-area handling is untouched. */}
      <OfflineBanner topInset />
      <View style={{ flex: 1 }}>
        {session ? <AppNavigator /> : <AuthNavigator />}
      </View>
    </NavigationContainer>
  );
}

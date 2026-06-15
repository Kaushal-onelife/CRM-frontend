import React, { useState, useEffect } from "react";
import { View } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { supabase } from "../services/supabase";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import { useTheme } from "../context/ThemeContext";
import { SkeletonList } from "../components/ui";

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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
      {session ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

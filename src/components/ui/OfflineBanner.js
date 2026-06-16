import React from "react";
import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useOnline } from "../../hooks/useOnline";

// Thin banner shown only when offline, so users trust they're seeing cached data
// and know new changes will sync later. Renders nothing when online.
// `topInset` adds the status-bar height when the banner is the topmost element.
export default function OfflineBanner({ topInset = false }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const online = useOnline();

  if (online) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      exiting={FadeOutUp.duration(200)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.warningSoft,
        paddingTop: (topInset ? insets.top : 0) + 6,
        paddingBottom: 6,
        paddingHorizontal: 12,
        gap: 6,
      }}
    >
      <MaterialCommunityIcons name="cloud-off-outline" size={14} color={colors.warning} />
      <Text style={{ color: colors.warning, fontSize: 12, fontWeight: "600" }}>
        Offline — showing saved data
      </Text>
    </Animated.View>
  );
}

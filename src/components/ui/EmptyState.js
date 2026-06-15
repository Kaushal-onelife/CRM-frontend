import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import Button from "./Button";

// Friendly empty / error placeholder — softens "nothing here" moments so the
// app never feels broken or dead. Optionally shows a call-to-action.
export default function EmptyState({
  icon = "inbox-outline",
  title = "Nothing here yet",
  message,
  actionLabel,
  onAction,
  tone = "neutral", // "neutral" | "error"
}) {
  const { colors } = useTheme();
  const accent = tone === "error" ? colors.danger : colors.primary;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 32 }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: tone === "error" ? colors.dangerSoft : colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <MaterialCommunityIcons name={icon} size={34} color={accent} />
      </View>
      <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", textAlign: "center" }}>
        {title}
      </Text>
      {message ? (
        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", marginTop: 6, lineHeight: 20 }}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 20 }}>
          <Button title={actionLabel} onPress={onAction} fullWidth={false} size="sm" />
        </View>
      ) : null}
    </Animated.View>
  );
}

import React from "react";
import { View, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function StatCard({ title, value, color = "#2563EB" }) {
  const { colors } = useTheme();

  return (
    <View
      className="rounded-2xl p-4 mb-3 shadow-sm"
      style={{
        backgroundColor: colors.card,
        borderLeftWidth: 4,
        borderLeftColor: color,
        width: "47%",
      }}
    >
      <Text
        className="text-2xl font-bold mb-1"
        style={{ color: colors.text }}
      >
        {value}
      </Text>
      <Text
        className="text-xs"
        style={{ color: colors.textSecondary }}
      >
        {title}
      </Text>
    </View>
  );
}

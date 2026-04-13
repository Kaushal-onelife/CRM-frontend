import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function StatCard({ title, value, color = "#2563EB", icon }) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        width: "47%",
        backgroundColor: colors.card,
        borderRadius: 18,
        padding: 16,
        marginBottom: 2,
        borderWidth: 1,
        borderColor: isDark ? "#262640" : "#F1F5F9",
        shadowColor: color,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.15 : 0.08,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      {/* Icon row */}
      <View style={{ marginBottom: 14 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: `${color}18`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons name={icon || "chart-bar"} size={20} color={color} />
        </View>
      </View>

      {/* Value */}
      <Text
        style={{
          fontSize: 22,
          fontWeight: "800",
          color: colors.text,
          letterSpacing: -0.5,
          marginBottom: 3,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>

      {/* Label */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: colors.textSecondary,
          letterSpacing: 0.2,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
}

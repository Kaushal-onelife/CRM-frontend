import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const STATUS_CONFIG = {
  scheduled: {
    color: "#2563EB",
    bg: "#EFF6FF",
    darkBg: "#1E3A5F",
    icon: "clock-outline",
  },
  pending: {
    color: "#F59E0B",
    bg: "#FFFBEB",
    darkBg: "#422006",
    icon: "timer-sand",
  },
  in_progress: {
    color: "#8B5CF6",
    bg: "#F5F3FF",
    darkBg: "#2E1065",
    icon: "progress-wrench",
  },
  completed: {
    color: "#10B981",
    bg: "#ECFDF5",
    darkBg: "#064E3B",
    icon: "check-circle-outline",
  },
  rejected: {
    color: "#EF4444",
    bg: "#FEF2F2",
    darkBg: "#450A0A",
    icon: "close-circle-outline",
  },
  cancelled: {
    color: "#6B7280",
    bg: "#F9FAFB",
    darkBg: "#374151",
    icon: "cancel",
  },
};

const SERVICE_TYPE_ICONS = {
  installation: "wrench",
  repair: "hammer-wrench",
  maintenance: "cog-refresh",
  filter_replacement: "filter",
  inspection: "clipboard-check-outline",
  complaint: "alert-circle-outline",
  default: "water-pump",
};

export default function ServiceCard({ service, onPress }) {
  const { isDark, colors } = useTheme();
  const status = STATUS_CONFIG[service.status] || STATUS_CONFIG.cancelled;
  const badgeBg = isDark ? status.darkBg : status.bg;
  const serviceIcon =
    SERVICE_TYPE_ICONS[service.service_type] || SERVICE_TYPE_ICONS.default;
  const statusLabel =
    service.status === "scheduled"
      ? "scheduled"
      : service.status.replace(/_/g, " ");

  return (
    <TouchableOpacity
      className="rounded-2xl mb-4 overflow-hidden"
      style={{
        backgroundColor: colors.card,
        shadowColor: status.color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: isDark ? "#374151" : "#F3F4F6",
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 4,
          height: "100%",
          backgroundColor: status.color,
          position: "absolute",
          left: 0,
          top: 0,
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
        }}
      />

      <View className="pl-5 pr-4 py-4">
        <View className="flex-row items-center">
          <View
            className="rounded-2xl items-center justify-center mr-4"
            style={{
              width: 48,
              height: 48,
              backgroundColor: isDark ? colors.border : `${status.color}15`,
            }}
          >
            <MaterialCommunityIcons
              name={serviceIcon}
              size={24}
              color={status.color}
            />
          </View>

          <View className="flex-1 mr-3">
            <Text
              className="text-base font-extrabold tracking-tight"
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {service.customers?.name || "Unknown Customer"}
            </Text>
            <Text
              className="text-xs font-semibold capitalize mt-1 tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              {service.service_type.replace(/_/g, " ")}
            </Text>
          </View>

          <View
            className="flex-row items-center px-3 py-1.5 rounded-xl border"
            style={{ 
              backgroundColor: badgeBg,
              borderColor: `${status.color}30`
            }}
          >
            <MaterialCommunityIcons
              name={status.icon}
              size={13}
              color={status.color}
              style={{ marginRight: 4 }}
            />
            <Text
              className="text-xs font-bold capitalize tracking-tight"
              style={{ color: status.color }}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <View
          className="flex-row items-center mt-4 pt-3"
          style={{
            borderTopWidth: 1,
            borderTopColor: isDark ? "#374151" : "#F1F5F9",
          }}
        >
          <MaterialCommunityIcons
            name="calendar-clock"
            size={16}
            color={status.color}
            style={{ marginRight: 6 }}
          />
          <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
            {service.scheduled_date}
          </Text>

          {service.customers?.phone && (
            <>
              <View
                className="w-1 h-1 rounded-full mx-3"
                style={{ backgroundColor: colors.textSecondary, opacity: 0.3 }}
              />
              <MaterialCommunityIcons
                name="phone-outline"
                size={16}
                color={colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
                {service.customers.phone}
              </Text>
            </>
          )}

          <View className="flex-1 items-end">
            <View
              className="rounded-full p-1"
              style={{ backgroundColor: isDark ? "#374151" : "#F3F4F6" }}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={16}
                color={colors.textSecondary}
              />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

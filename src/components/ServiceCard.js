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
      className="rounded-2xl mb-4"
      style={{
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={{
          height: 3,
          backgroundColor: status.color,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      />

      <View className="p-4">
        <View className="flex-row items-center">
          <View
            className="rounded-xl items-center justify-center mr-3"
            style={{
              width: 44,
              height: 44,
              backgroundColor: isDark ? colors.border : "#F1F5F9",
            }}
          >
            <MaterialCommunityIcons
              name={serviceIcon}
              size={22}
              color={status.color}
            />
          </View>

          <View className="flex-1 mr-3">
            <Text
              className="text-base font-bold"
              style={{ color: colors.text, letterSpacing: 0.1 }}
              numberOfLines={1}
            >
              {service.customers?.name}
            </Text>
            <Text
              className="text-sm capitalize mt-0.5"
              style={{ color: colors.textSecondary }}
            >
              {service.service_type.replace(/_/g, " ")}
            </Text>
          </View>

          <View
            className="flex-row items-center px-3 py-1.5 rounded-full"
            style={{ backgroundColor: badgeBg }}
          >
            <MaterialCommunityIcons
              name={status.icon}
              size={13}
              color={status.color}
              style={{ marginRight: 4 }}
            />
            <Text
              className="text-xs font-semibold capitalize"
              style={{ color: status.color }}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <View
          className="flex-row items-center mt-3 pt-3"
          style={{
            borderTopWidth: 1,
            borderTopColor: isDark ? colors.border : "#F1F5F9",
          }}
        >
          <MaterialCommunityIcons
            name="calendar-clock"
            size={14}
            color={colors.textSecondary}
            style={{ marginRight: 5 }}
          />
          <Text className="text-xs" style={{ color: colors.textSecondary }}>
            {service.scheduled_date}
          </Text>

          {service.customers?.phone && (
            <>
              <View
                className="w-1 h-1 rounded-full mx-2.5"
                style={{ backgroundColor: colors.textSecondary, opacity: 0.4 }}
              />
              <MaterialCommunityIcons
                name="phone-outline"
                size={13}
                color={colors.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {service.customers.phone}
              </Text>
            </>
          )}

          <View className="flex-1 items-end">
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

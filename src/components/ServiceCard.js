import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { formatServiceType } from "../utils/serviceLabels";

// Helper to determine display status for 'scheduled' services
function getDisplayStatus(service) {
  if (service.status !== "scheduled") return service.status;
  const today = new Date().toISOString().split("T")[0];
  // A service scheduled for today is actionable now, so it counts as "due".
  return service.scheduled_date > today ? "upcoming" : "due";
}

const STATUS_CONFIG = {
  upcoming: {
    color: "#2563EB",
    bg: "#EFF6FF",
    darkBg: "#1E3A5F",
    icon: "clock-outline",
    label: "Upcoming",
  },
  due: {
    color: "#F97316",
    bg: "#FFF7ED",
    darkBg: "#431407",
    icon: "clock-alert-outline",
    label: "Due",
  },
  pending: {
    color: "#F59E0B",
    bg: "#FFFBEB",
    darkBg: "#422006",
    icon: "timer-sand",
    label: "Pending",
  },
  completed: {
    color: "#10B981",
    bg: "#ECFDF5",
    darkBg: "#064E3B",
    icon: "check-circle-outline",
    label: "Completed",
  },
  rejected: {
    color: "#EF4444",
    bg: "#FEF2F2",
    darkBg: "#450A0A",
    icon: "close-circle-outline",
    label: "Rejected",
  },
  followup: {
    color: "#8B5CF6",
    bg: "#F5F3FF",
    darkBg: "#2E1065",
    icon: "phone-return-outline",
    label: "Follow Up",
  },
};

const SERVICE_TYPE_ICONS = {
  installation: "wrench",
  repair: "hammer-wrench",
  maintenance: "cog-refresh",
  filter_replacement: "filter",
  filter_change: "filter",
  amc: "shield-check-outline",
  amc_service: "shield-check-outline", // legacy orphan type
  general_service: "water-pump",
  inspection: "clipboard-check-outline",
  complaint: "alert-circle-outline",
  default: "water-pump",
};


function ServiceCard({ service, onPress }) {
  const { isDark, colors, elevation } = useTheme();
  const displayStatus = getDisplayStatus(service);
  const status = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.upcoming;
  const badgeBg = isDark ? status.darkBg : status.bg;
  const serviceIcon =
    SERVICE_TYPE_ICONS[service.service_type] || SERVICE_TYPE_ICONS.default;

  // Pass the service to the parent so list parents can use a single stable
  // `onPress` callback (better React.memo behavior).
  const handlePress = React.useCallback(() => {
    onPress?.(service);
  }, [onPress, service]);

  return (
    <TouchableOpacity
      className="rounded-2xl mb-4"
      style={{
        backgroundColor: colors.card,
        // Shared shadow token (same as Card / Dashboard stats) — single source.
        ...elevation("md"),
      }}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Accent top bar */}
      <View
        style={{
          height: 3,
          backgroundColor: status.color,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
      />

      <View className="p-4">
        {/* Header row */}
        <View className="flex-row items-center">
          {/* Service type icon */}
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

          {/* Name & type */}
          <View className="flex-1 mr-3">
            <Text
              className="text-base font-bold"
              style={{ color: colors.text, letterSpacing: 0.1 }}
              numberOfLines={1}
            >
              {service.customers?.name}
            </Text>
            <Text
              className="text-sm mt-0.5"
              style={{ color: colors.textSecondary }}
            >
              {formatServiceType(service.service_type)}
            </Text>
          </View>

          {/* Status badge */}
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
              className="text-xs font-semibold"
              style={{ color: status.color }}
            >
              {status.label}
            </Text>
          </View>
        </View>

        {/* Footer row */}
        <View
          className="flex-row items-center mt-3 pt-3"
          style={{ borderTopWidth: 1, borderTopColor: isDark ? colors.border : "#F1F5F9" }}
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

          {/* Arrow indicator */}
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

export default React.memo(ServiceCard);

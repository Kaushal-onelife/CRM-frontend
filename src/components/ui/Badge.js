import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { statusColors } from "../../theme/tokens";

// Human labels for status keys, so a bare `status` prop renders the SAME word
// everywhere (not the title-cased raw value). Keep this the one source of truth
// for status wording; callers may still override via an explicit `label`.
const STATUS_LABELS = {
  upcoming: "Upcoming",
  due: "Due",
  pending: "To do", // DB value is "pending" (customer accepted, not yet done)
  completed: "Completed",
  rejected: "Rejected",
  followup: "Follow Up",
};

// Pill badge. Either pass `status` (upcoming/due/pending/completed/rejected/
// followup) for preset colors, or pass explicit `color` + `label`.
export default function Badge({ status, label, color, icon, size = "md" }) {
  const { isDark, radius } = useTheme();
  const preset = status ? statusColors[status] : null;
  const fg = color || preset?.fg || "#6B7280";
  const bg = preset ? (isDark ? preset.softDark : preset.soft) : `${fg}1A`;
  const text =
    label ||
    STATUS_LABELS[status] ||
    (status ? status[0].toUpperCase() + status.slice(1) : "");

  const dims = size === "sm" ? { py: 3, px: 8, font: 11, icon: 11 } : { py: 5, px: 11, font: 12, icon: 13 };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: bg,
        paddingVertical: dims.py,
        paddingHorizontal: dims.px,
        borderRadius: radius.full,
      }}
    >
      {icon ? (
        <MaterialCommunityIcons name={icon} size={dims.icon} color={fg} style={{ marginRight: 4 }} />
      ) : null}
      <Text style={{ color: fg, fontSize: dims.font, fontWeight: "600" }}>{text}</Text>
    </View>
  );
}

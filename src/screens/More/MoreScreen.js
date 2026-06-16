import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { tap } from "../../utils/haptics";

// Secondary features live here instead of cluttering the bottom tab bar.
// Each row navigates into its own stack (registered in MoreNavigator).
const ITEMS = [
  {
    route: "Reminders",
    label: "Reminders",
    subtitle: "Service due, overdue & AMC expiring",
    icon: "bell-ring-outline",
    color: "warning",
  },
  {
    route: "Bills",
    label: "Bills",
    subtitle: "Invoices and payments",
    icon: "receipt",
    color: "primary",
  },
  {
    route: "AMC",
    label: "AMC Contracts",
    subtitle: "Annual maintenance contracts",
    icon: "file-document-check-outline",
    color: "accent",
  },
  {
    route: "Inventory",
    label: "Parts Inventory",
    subtitle: "Filters and spare parts stock",
    icon: "package-variant-closed",
    color: "warning",
  },
  {
    route: "Settings",
    label: "Settings",
    subtitle: "Profile, business info, theme",
    icon: "cog-outline",
    color: "textSecondary",
  },
];

function MenuRow({ item, index, onPress }) {
  const { colors, radius, elevation } = useTheme();
  const tint = colors[item.color] || colors.primary;

  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 60).duration(320)}>
      <Pressable
        onPress={() => {
          tap();
          onPress(item.route);
        }}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: 16,
            marginBottom: 12,
            opacity: pressed ? 0.85 : 1,
          },
          elevation("sm"),
        ]}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: `${tint}1A`,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <MaterialCommunityIcons name={item.icon} size={22} color={tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>
            {item.label}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
            {item.subtitle}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

export default function MoreScreen({ navigation }) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {ITEMS.map((item, i) => (
        <MenuRow
          key={item.route}
          item={item}
          index={i}
          onPress={(route) => navigation.navigate(route)}
        />
      ))}
    </ScrollView>
  );
}

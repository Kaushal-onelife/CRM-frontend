import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Card } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import { tap } from "../../utils/haptics";
import { tint as withAlpha } from "../../utils/color";

// Secondary features live here instead of cluttering the bottom tab bar.
// Each row navigates into its own stack (registered in MoreNavigator).
const ITEMS = [
  {
    route: "Notifications",
    label: "Notifications",
    subtitle: "Payments, alerts & activity",
    icon: "bell-outline",
    color: "primary",
  },
  {
    route: "Reminders",
    label: "Follow-ups",
    subtitle: "Customers to call today — due, overdue & AMC",
    icon: "phone-outline",
    color: "warning",
  },
  {
    route: "Revenue",
    label: "Revenue",
    subtitle: "Monthly earnings, collected & dues",
    icon: "chart-line",
    color: "success",
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
  const { colors } = useTheme();
  const tint = colors[item.color] || colors.primary;

  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 60).duration(320)}>
      {/* Same Card-based row as the Customer list, so both lists look identical. */}
      <Card
        onPress={() => {
          tap();
          onPress(item.route);
        }}
        style={styles.card}
        padded={false}
      >
        <View style={styles.cardInner}>
          <View style={[styles.iconChip, { backgroundColor: withAlpha(tint, 0.1) }]}>
            <MaterialCommunityIcons name={item.icon} size={22} color={tint} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text
              style={[styles.subtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.subtitle}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.textMuted}
            style={{ marginLeft: 4 }}
          />
        </View>
      </Card>
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

// Mirrors CustomerListScreen's row styles so the two lists are visually identical.
// Only difference: a rounded-square icon chip instead of a round avatar.
const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});

import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationAPI } from "../services/api";
import { Card } from "./ui";
import { useTheme } from "../context/ThemeContext";

// Per-category push toggles. Muting a category stops the device buzz but the
// item still appears in the in-app Notification Center.
const CATEGORIES = [
  { key: "money", label: "Payments & billing", icon: "cash-multiple", subtitle: "Payments received, unpaid bills" },
  { key: "service", label: "Services", icon: "wrench-outline", subtitle: "Assignments & completions" },
  { key: "amc", label: "AMC contracts", icon: "file-document-outline", subtitle: "Expiring, expired, renewed" },
  { key: "reminder", label: "Daily reminders", icon: "bell-ring-outline", subtitle: "Morning due/overdue summary" },
];

export default function NotificationPrefs() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notify-prefs"],
    queryFn: () => notificationAPI.getPrefs(),
  });
  const prefs = data?.prefs || {};

  const setPref = useMutation({
    mutationFn: ({ category, enabled }) => notificationAPI.setPref(category, enabled),
    // Optimistic — flip instantly, roll back on error.
    onMutate: async ({ category, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ["notify-prefs"] });
      const prev = queryClient.getQueryData(["notify-prefs"]);
      queryClient.setQueryData(["notify-prefs"], (old) => ({
        prefs: { ...(old?.prefs || {}), [category]: enabled },
      }));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["notify-prefs"], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notify-prefs"] }),
  });

  return (
    <Card style={styles.card}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>Notifications</Text>
      {CATEGORIES.map((cat, idx) => {
        const enabled = prefs[cat.key] !== false;
        return (
          <View
            key={cat.key}
            style={[
              styles.row,
              idx < CATEGORIES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
            ]}
          >
            <View style={styles.left}>
              <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                <MaterialCommunityIcons name={cat.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text }]}>{cat.label}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{cat.subtitle}</Text>
              </View>
            </View>
            <Switch
              value={enabled}
              onValueChange={(v) => setPref.mutate({ category: cat.key, enabled: v })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              ios_backgroundColor={colors.border}
            />
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, padding: 16 },
  cardTitle: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, opacity: 0.7 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  left: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  label: { fontSize: 15, fontWeight: "600" },
  subtitle: { fontSize: 12, marginTop: 2 },
});

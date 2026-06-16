import React from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, Linking, Alert } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { reminderAPI } from "../../services/api";
import { Card, Badge, Button, EmptyState, SkeletonList } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import {
  buildReminderMessage,
  buildWhatsAppUrl,
  relativeWhen,
} from "../../utils/reminderMessages";

// Section config: maps reminder type -> visual treatment.
const SECTIONS = [
  { key: "overdue", title: "Overdue", icon: "alert-circle-outline", tone: "danger" },
  { key: "due_soon", title: "Due Soon", icon: "clock-outline", tone: "warning" },
  { key: "amc_expiring", title: "AMC Expiring", icon: "file-document-alert-outline", tone: "warning" },
];

function ReminderRow({ item, businessName, index, onOpenCustomer }) {
  const { colors, radius, elevation } = useTheme();

  const message = buildReminderMessage({
    customerName: item.customer_name,
    businessName,
    type: item.type,
    date: item.date,
    label: item.label,
  });

  const overdue = item.days_until < 0;

  const handleWhatsApp = async () => {
    if (!item.customer_phone) {
      Alert.alert("No phone number", "This customer has no phone number on file.");
      return;
    }
    try {
      await Linking.openURL(buildWhatsAppUrl(item.customer_phone, message));
    } catch (e) {
      Alert.alert("Couldn't open WhatsApp", "Make sure WhatsApp is installed.");
    }
  };

  const handleCall = () => {
    if (!item.customer_phone) {
      Alert.alert("No phone number", "This customer has no phone number on file.");
      return;
    }
    Linking.openURL(`tel:${item.customer_phone}`);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(280)}>
      {/* Tapping the card opens the customer's detail page. */}
      <Card
        onPress={() => onOpenCustomer(item)}
        haptic
        style={{ marginBottom: 10 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", flex: 1 }} numberOfLines={1}>
            {item.customer_name}
          </Text>
          <Badge
            label={relativeWhen(item.days_until)}
            color={overdue ? colors.danger : colors.warning}
            size="sm"
          />
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }} numberOfLines={1}>
          {item.label ? item.label.replace(/_/g, " ") : "—"}
          {item.customer_phone ? `  ·  ${item.customer_phone}` : ""}
        </Text>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            title="WhatsApp"
            icon="whatsapp"
            size="sm"
            fullWidth={false}
            onPress={handleWhatsApp}
            style={{ flex: 1, backgroundColor: "#25D366" }}
          />
          <Button
            title="Call"
            icon="phone"
            variant="secondary"
            size="sm"
            fullWidth={false}
            onPress={handleCall}
            style={{ flex: 1 }}
          />
        </View>
      </Card>
    </Animated.View>
  );
}

export default function RemindersScreen({ navigation }) {
  const { colors } = useTheme();

  const { data, error, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => reminderAPI.get(),
  });

  // Reminders live in the More tab; CustomerDetail lives in the Customers tab —
  // so this is a cross-tab navigation.
  const openCustomer = (item) =>
    navigation.navigate("Customers", {
      screen: "CustomerDetail",
      params: { id: item.customer_id, name: item.customer_name },
    });

  if (isLoading && !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonList count={5} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}>
        <EmptyState
          tone="error"
          icon="cloud-off-outline"
          title="Couldn't load reminders"
          message={error.message || "Please try again."}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  const total = data?.counts?.total || 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} tintColor={colors.primary} onRefresh={() => refetch()} />
      }
    >
      {total === 0 ? (
        <View style={{ flex: 1, marginTop: 40 }}>
          <EmptyState
            icon="check-circle-outline"
            title="All caught up 🎉"
            message="No customers need a reminder right now."
          />
        </View>
      ) : (
        SECTIONS.map((section) => {
          const items = data?.[section.key] || [];
          if (items.length === 0) return null;
          const tone = section.tone === "danger" ? colors.danger : colors.warning;
          return (
            <View key={section.key} style={{ marginBottom: 8 }}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name={section.icon} size={18} color={tone} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                <Badge label={String(items.length)} color={tone} size="sm" />
              </View>
              {items.map((item, i) => (
                <ReminderRow
                  key={item.ref_id}
                  item={item}
                  index={i}
                  businessName={data?.business_name}
                  onOpenCustomer={openCustomer}
                />
              ))}
            </View>
          );
        })
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
});

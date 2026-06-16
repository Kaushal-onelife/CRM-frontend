import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serviceAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import DatePickerField from "../../components/DatePickerField";
import { Card, Badge, Button, EmptyState, Skeleton } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

// Helper to determine display status for 'scheduled' services
function getDisplayStatus(service) {
  if (service.status !== "scheduled") return service.status;
  const today = new Date().toISOString().split("T")[0];
  return service.scheduled_date >= today ? "upcoming" : "due";
}

// Map raw display status -> Badge status preset + accent color helper key.
const STATUS_PRESET = {
  upcoming: "upcoming",
  due: "due",
  pending: "pending",
  completed: "completed",
  rejected: "rejected",
  followup: "followup",
};

export default function ServiceDetailScreen({ route, navigation }) {
  const { colors, spacing, radius } = useTheme();
  const { id } = route.params;
  const [nextContactDate, setNextContactDate] = useState("");
  const [showFollowupForm, setShowFollowupForm] = useState(false);

  const [actionInFlight, setActionInFlight] = useState(null);

  // Cache-first: persisted data shows instantly (incl. offline), then refreshes.
  const {
    data: service,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["service", id],
    queryFn: () => serviceAPI.getById(id),
  });

  const handleStatusChange = async (newStatus, extraData = {}, actionKey = newStatus) => {
    if (!requireOnline()) return;
    if (actionInFlight) return;
    setActionInFlight(actionKey);
    try {
      await serviceAPI.update(id, { status: newStatus, ...extraData });
      await refetch();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setActionInFlight(null);
    }
  };

  const handleFollowup = async () => {
    const extra = {};
    if (nextContactDate) extra.next_contact_date = nextContactDate;
    await handleStatusChange("followup", extra, "followup-confirm");
    setShowFollowupForm(false);
    setNextContactDate("");
  };

  // Skeletons only when there's no cached data yet.
  if (isLoading && !service) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
        <Skeleton width="40%" height={28} radius={radius.full} style={{ alignSelf: "center", marginVertical: spacing.lg }} />
        <Skeleton width="100%" height={180} radius={radius.lg} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={120} radius={radius.lg} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={56} radius={radius.md} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={56} radius={radius.md} />
      </View>
    );
  }

  // Only show the error screen when we have NO cached data to fall back on.
  if (!service) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <EmptyState
          tone="error"
          icon="cloud-off-outline"
          title={error ? "Couldn't load service" : "Service not found"}
          message={error?.message || undefined}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  const displayStatus = getDisplayStatus(service);
  const statusPreset = STATUS_PRESET[displayStatus] || "upcoming";
  // Actions available for scheduled (upcoming/due), pending, followup
  const isActionable = ["scheduled", "pending", "followup"].includes(service.status);

  const detailRows = [
    { label: "Type", value: service.service_type.replace(/_/g, " ") },
    { label: "Scheduled Date", value: service.scheduled_date },
    { label: "Completed Date", value: service.completed_date },
    { label: "Next Due Date", value: service.next_due_date },
    { label: "Next Contact", value: service.next_contact_date },
    { label: "Amount", value: service.amount > 0 ? `₹${parseFloat(service.amount).toFixed(2)}` : null },
    { label: "Service Charge", value: service.service_charge > 0 ? `₹${parseFloat(service.service_charge).toFixed(2)}` : null },
    { label: "Notes", value: service.notes },
  ].filter((item) => item.value);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
      showsVerticalScrollIndicator={false}
    >
      {/* Status badge */}
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={{ alignItems: "center", marginBottom: spacing.lg }}
      >
        <Badge status={statusPreset} size="md" />
      </Animated.View>

      {/* Service Info */}
      <Animated.View entering={FadeInDown.delay(60).duration(350)}>
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: spacing.md }}>
            Service Details
          </Text>
          {detailRows.map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: "row",
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.divider,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14, width: 130 }}>{item.label}</Text>
              <Text style={{ color: colors.text, fontSize: 14, flex: 1, textTransform: "capitalize" }}>
                {item.value}
              </Text>
            </View>
          ))}

          {/* Parts replaced */}
          {service.parts_replaced && service.parts_replaced.length > 0 && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginBottom: spacing.xs }}>
                Parts Replaced
              </Text>
              {service.parts_replaced.map((part, index) => (
                <Text key={index} style={{ color: colors.text, fontSize: 13, marginTop: spacing.xs, marginLeft: spacing.sm }}>
                  {part.name} x{part.quantity} - ₹{parseFloat(part.cost).toFixed(2)}
                </Text>
              ))}
            </View>
          )}
        </Card>
      </Animated.View>

      {/* Customer Info */}
      {service.customers && (
        <Animated.View entering={FadeInDown.delay(120).duration(350)}>
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: spacing.md }}>
              Customer
            </Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
              {service.customers.name}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
              {service.customers.phone}
            </Text>
            {service.customers.purifier_model && (
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: spacing.xs }}>
                {service.customers.purifier_brand} - {service.customers.purifier_model}
              </Text>
            )}
            {service.customers.address && (
              <Text style={{ color: colors.text, fontSize: 13, marginTop: spacing.xs }}>
                {service.customers.address}
              </Text>
            )}
            <View style={{ flexDirection: "row", marginTop: spacing.md, gap: spacing.md }}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.primarySoft,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  gap: spacing.xs,
                }}
                onPress={() => Linking.openURL(`tel:${service.customers.phone}`)}
              >
                <MaterialCommunityIcons name="phone" size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.successSoft,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  gap: spacing.xs,
                }}
                onPress={() => {
                  const phone = service.customers.phone.replace(/\D/g, "");
                  const number = phone.startsWith("91") ? phone : `91${phone}`;
                  Linking.openURL(`whatsapp://send?phone=${number}`);
                }}
              >
                <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
                <Text style={{ color: colors.success, fontSize: 13, fontWeight: "600" }}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>
      )}

      {/* Action Buttons */}
      {isActionable && (
        <Animated.View entering={FadeInDown.delay(180).duration(350)} style={{ gap: spacing.md }}>
          {/* Pending - customer accepted */}
          {(service.status === "scheduled" || service.status === "followup") && (
            <Button
              title="Customer Accepted (Pending)"
              icon="check"
              variant="primary"
              style={{ backgroundColor: colors.warning }}
              loading={actionInFlight === "pending"}
              disabled={!!actionInFlight}
              onPress={() => handleStatusChange("pending")}
            />
          )}

          {/* Complete - navigate to completion form */}
          <Button
            title="Mark as Completed"
            icon="check-circle"
            variant="success"
            disabled={!!actionInFlight}
            onPress={() => navigation.navigate("CompleteService", { id: service.id })}
          />

          {/* Follow Up */}
          {(service.status === "scheduled" || service.status === "followup") && (
            <>
              <Button
                title="Mark as Follow Up"
                icon="phone-return-outline"
                variant="primary"
                style={{ backgroundColor: colors.accent }}
                disabled={!!actionInFlight}
                onPress={() => setShowFollowupForm(!showFollowupForm)}
              />

              {showFollowupForm && (
                <Card style={{ gap: spacing.sm }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "500" }}>
                    Next Contact Date (optional)
                  </Text>
                  <DatePickerField
                    value={nextContactDate}
                    onChange={setNextContactDate}
                    placeholder="Pick a date"
                    minimumDate={new Date()}
                  />
                  <Button
                    title="Confirm Follow Up"
                    variant="primary"
                    style={{ backgroundColor: colors.accent, marginTop: spacing.sm }}
                    loading={actionInFlight === "followup-confirm"}
                    disabled={!!actionInFlight}
                    onPress={handleFollowup}
                  />
                </Card>
              )}
            </>
          )}

          {/* Reject */}
          <Button
            title="Reject"
            icon="close-circle"
            variant="danger"
            loading={actionInFlight === "rejected"}
            disabled={!!actionInFlight}
            onPress={() =>
              Alert.alert("Reject Service", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Reject",
                  style: "destructive",
                  onPress: () => handleStatusChange("rejected"),
                },
              ])
            }
          />
        </Animated.View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

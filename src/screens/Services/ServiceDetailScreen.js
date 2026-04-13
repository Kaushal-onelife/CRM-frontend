import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serviceAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import FormInput, { FormSection } from "../../components/FormInput";

const STATUS_CONFIG = {
  scheduled: { color: "#2563EB", label: "Scheduled", icon: "calendar-clock" },
  pending: { color: "#F59E0B", label: "Pending", icon: "clock-alert-outline" },
  in_progress: { color: "#8B5CF6", label: "In Progress", icon: "progress-wrench" },
  completed: { color: "#10B981", label: "Completed", icon: "check-decagram" },
  rejected: { color: "#EF4444", label: "Rejected", icon: "close-octagon-outline" },
  cancelled: { color: "#6B7280", label: "Cancelled", icon: "cancel" },
};

export default function ServiceDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors, isDark } = useTheme();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showComplete, setShowComplete] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    next_due_date: "",
    amount: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchService = async () => {
    try {
      const data = await serviceAPI.getById(id);
      setService(data);
      setCompleteForm(prev => ({ ...prev, amount: String(data.amount || "") }));
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchService();
    }, [id])
  );

  const handleMarkCompleted = async () => {
    if (
      completeForm.next_due_date &&
      !/^\d{4}-\d{2}-\d{2}$/.test(completeForm.next_due_date)
    ) {
      Alert.alert("Invalid Date", "Next due date must be in YYYY-MM-DD format.");
      return;
    }

    setSubmitting(true);
    try {
      await serviceAPI.markCompleted(id, {
        next_due_date: completeForm.next_due_date || null,
        service_charge: completeForm.amount ? parseFloat(completeForm.amount) : 0,
        notes: completeForm.notes || service.notes,
      });
      Alert.alert("Job Finished", "Service status updated to completed.", [
        {
          text: "Done",
          onPress: () => {
            setShowComplete(false);
            fetchService();
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setSubmitting(false);
  };

  const handleStatusChange = async newStatus => {
    try {
      await serviceAPI.update(id, { status: newStatus });
      fetchService();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <Text style={{ color: colors.text }}>Job record not found</Text>
      </View>
    );
  }

  const config = STATUS_CONFIG[service.status] || STATUS_CONFIG.pending;
  const isActionable = ["scheduled", "pending", "in_progress"].includes(service.status);
  const serviceTypeLabel = service.service_type.replace(/_/g, " ");
  const customerName = service.customers?.name || "Assigned customer";
  const amountLabel = service.amount > 0 ? `\u20B9${service.amount}` : "To be quoted";

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
    >
      <View
        className="px-6 pt-6 pb-7"
        style={{
          backgroundColor: colors.card,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          borderBottomWidth: 1,
          borderColor: isDark ? "#1F2937" : "#E5E7EB",
        }}
      >
        <View
          className="p-5 rounded-[28px] overflow-hidden"
          style={{
            backgroundColor: `${config.color}12`,
            borderWidth: 1,
            borderColor: `${config.color}25`,
          }}
        >
          <View
            className="absolute -top-10 -right-6 w-36 h-36 rounded-full"
            style={{ backgroundColor: `${config.color}22` }}
          />
          <View
            className="absolute top-16 -left-10 w-28 h-28 rounded-full"
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.55)" }}
          />
          <View
            className="absolute bottom-0 right-10 w-24 h-24 rounded-full"
            style={{ backgroundColor: isDark ? "rgba(15,23,42,0.18)" : `${config.color}10` }}
          />
          <View
            className="absolute inset-0"
            style={{
              backgroundColor: isDark ? "rgba(2, 6, 23, 0.16)" : "rgba(255,255,255,0.18)",
            }}
          />

          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center mb-4">
                <View
                  className="w-14 h-14 rounded-[20px] items-center justify-center mr-4"
                  style={{
                    backgroundColor: config.color,
                    shadowColor: config.color,
                    shadowOpacity: 0.28,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 8,
                  }}
                >
                  <MaterialCommunityIcons name={config.icon} size={28} color="white" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[11px] uppercase font-black mb-1"
                    style={{ color: colors.textSecondary, letterSpacing: 2 }}
                  >
                    Service Ticket
                  </Text>
                  <Text className="text-2xl font-black capitalize" style={{ color: colors.text }}>
                    {serviceTypeLabel}
                  </Text>
                </View>
              </View>

              <Text className="text-sm leading-6" style={{ color: colors.textSecondary }}>
                Scheduled for {service.scheduled_date}
                {service.completed_date ? `  |  Completed on ${service.completed_date}` : ""}
              </Text>

              <View className="flex-row flex-wrap mt-4" style={{ gap: 10 }}>
                <View
                  className="px-4 py-2 rounded-full flex-row items-center"
                  style={{ backgroundColor: config.color }}
                >
                  <MaterialCommunityIcons name={config.icon} size={14} color="white" />
                  <Text className="text-white text-xs font-black ml-2">{config.label}</Text>
                </View>
                <View
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: isDark ? "rgba(17,24,39,0.88)" : "rgba(255,255,255,0.86)",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.65)",
                  }}
                >
                  <Text className="text-xs font-bold" style={{ color: colors.text }}>
                    {customerName}
                  </Text>
                </View>
              </View>
            </View>

            <View
              className="px-4 py-3 rounded-[20px] min-w-[120px]"
              style={{
                backgroundColor: isDark ? "rgba(15, 23, 42, 0.58)" : "rgba(255,255,255,0.9)",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
              }}
            >
              <Text
                className="text-[10px] uppercase font-black"
                style={{ color: colors.textSecondary, letterSpacing: 2 }}
              >
                Estimate
              </Text>
              <Text className="text-xl font-black mt-1" style={{ color: colors.text }}>
                {amountLabel}
              </Text>
            </View>
          </View>

          <View className="flex-row mt-5" style={{ gap: 12 }}>
            <View
              className="flex-1 p-4 rounded-[22px]"
              style={{
                backgroundColor: isDark ? "rgba(17, 24, 39, 0.75)" : "rgba(255,255,255,0.8)",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.65)",
              }}
            >
              <Text
                className="text-[10px] uppercase font-black"
                style={{ color: colors.textSecondary, letterSpacing: 2 }}
              >
                Next Visit
              </Text>
              <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
                {service.next_due_date || "Not scheduled"}
              </Text>
            </View>
            <View
              className="flex-1 p-4 rounded-[22px]"
              style={{
                backgroundColor: isDark ? "rgba(17, 24, 39, 0.75)" : "rgba(255,255,255,0.8)",
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.65)",
              }}
            >
              <Text
                className="text-[10px] uppercase font-black"
                style={{ color: colors.textSecondary, letterSpacing: 2 }}
              >
                Ticket ID
              </Text>
              <Text className="text-sm font-bold mt-2" style={{ color: colors.text }}>
                #{service.id}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="p-6">
        <FormSection title="Job Details" icon="wrench-cog" colors={colors} />

        <View
          className="p-5 rounded-3xl border mb-6 shadow-sm"
          style={{ backgroundColor: colors.card, borderColor: isDark ? "#374151" : "#F3F4F6" }}
        >
          <View className="flex-row mb-4">
            <View className="flex-1">
              <Text
                className="text-[10px] uppercase font-black tracking-tighter"
                style={{ color: colors.textSecondary }}
              >
                Service Type
              </Text>
              <Text className="text-base font-bold capitalize" style={{ color: colors.text }}>
                {serviceTypeLabel}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-[10px] uppercase font-black tracking-tighter"
                style={{ color: colors.textSecondary }}
              >
                Scheduled Date
              </Text>
              <Text className="text-base font-bold" style={{ color: colors.text }}>
                {service.scheduled_date}
              </Text>
            </View>
          </View>

          {service.completed_date && (
            <View className="flex-row mb-4">
              <View className="flex-1">
                <Text
                  className="text-[10px] uppercase font-black tracking-tighter"
                  style={{ color: colors.textSecondary }}
                >
                  Finished On
                </Text>
                <Text className="text-base font-bold" style={{ color: colors.text }}>
                  {service.completed_date}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-[10px] uppercase font-black tracking-tighter"
                  style={{ color: colors.textSecondary }}
                >
                  Next Visit
                </Text>
                <Text className="text-base font-bold" style={{ color: colors.primary }}>
                  {service.next_due_date || "N/A"}
                </Text>
              </View>
            </View>
          )}

          {service.notes && (
            <View className="mt-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <Text
                className="text-[10px] uppercase font-black tracking-tighter mb-1"
                style={{ color: colors.textSecondary }}
              >
                Technician Notes
              </Text>
              <Text className="text-sm font-medium italic" style={{ color: colors.text }}>
                "{service.notes}"
              </Text>
            </View>
          )}
        </View>

        {service.customers && (
          <View>
            <FormSection title="Customer Contact" icon="account-circle-outline" colors={colors} />
            <View
              className="p-5 rounded-3xl border mb-6 shadow-sm flex-row items-center justify-between"
              style={{ backgroundColor: colors.card, borderColor: isDark ? "#374151" : "#F3F4F6" }}
            >
              <View className="flex-1 mr-4">
                <Text className="text-lg font-bold" style={{ color: colors.text }}>
                  {service.customers.name}
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  {service.customers.phone}
                </Text>
                <Text
                  className="text-xs mt-2"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={2}
                >
                  {service.customers.address}
                </Text>
              </View>
              <View className="flex-row" style={{ gap: 10 }}>
                <TouchableOpacity
                  className="w-12 h-12 rounded-2xl bg-blue-500 items-center justify-center shadow-md"
                  onPress={() => Linking.openURL(`tel:${service.customers.phone}`)}
                >
                  <MaterialCommunityIcons name="phone" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-12 h-12 rounded-2xl bg-emerald-500 items-center justify-center shadow-md"
                  onPress={() => {
                    const phone = service.customers.phone.replace(/\D/g, "");
                    const number = phone.startsWith("91") ? phone : `91${phone}`;
                    Linking.openURL(`whatsapp://send?phone=${number}`);
                  }}
                >
                  <MaterialCommunityIcons name="whatsapp" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {isActionable && (
          <View className="mt-4" style={{ gap: 12 }}>
            <FormSection title="Manage Workflow" icon="step-forward" colors={colors} />

            {service.status === "scheduled" && (
              <TouchableOpacity
                className="flex-row items-center justify-center p-4 rounded-2xl"
                style={{ backgroundColor: "#F59E0B" }}
                onPress={() => handleStatusChange("pending")}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-black">Mark as Pending</Text>
              </TouchableOpacity>
            )}

            {service.status === "pending" && (
              <TouchableOpacity
                className="flex-row items-center justify-center p-4 rounded-2xl"
                style={{ backgroundColor: "#8B5CF6" }}
                onPress={() => handleStatusChange("in_progress")}
              >
                <MaterialCommunityIcons
                  name="play-circle-outline"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-black">Begin Service Task</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="flex-row items-center justify-center p-4 rounded-2xl"
              style={{ backgroundColor: "#10B981" }}
              onPress={() => setShowComplete(!showComplete)}
            >
              <MaterialCommunityIcons
                name="check-all"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white font-black">
                {showComplete ? "Cancel Completion" : "Close & Finish Ticket"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center justify-center p-4 rounded-2xl border"
              style={{ borderColor: "#EF4444", backgroundColor: "#EF444410" }}
              onPress={() =>
                Alert.alert("Reject Ticket", "Are you sure you want to reject this service request?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reject Job",
                    style: "destructive",
                    onPress: () => handleStatusChange("rejected"),
                  },
                ])
              }
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color="#EF4444"
                style={{ marginRight: 8 }}
              />
              <Text className="font-black" style={{ color: "#EF4444" }}>
                Reject Job
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showComplete && (
          <View
            className="mt-8 p-6 rounded-3xl border bg-slate-50 dark:bg-slate-900/40"
            style={{ borderColor: isDark ? "#374151" : "#E2E8F0" }}
          >
            <FormSection title="Finalize Details" icon="file-check-outline" colors={colors} />

            <FormInput
              label="Next Service Due Date"
              placeholder="YYYY-MM-DD (Optional)"
              icon="calendar-plus"
              value={completeForm.next_due_date}
              onChangeText={v => setCompleteForm({ ...completeForm, next_due_date: v })}
            />

            <FormInput
              label="Final Service Charge (\u20B9)"
              placeholder="0.00"
              icon="currency-inr"
              keyboardType="numeric"
              value={completeForm.amount}
              onChangeText={v => setCompleteForm({ ...completeForm, amount: v })}
            />

            <FormInput
              label="Completion Notes"
              placeholder="Mention what parts were replaced or repaired..."
              icon="note-text-outline"
              multiline
              value={completeForm.notes}
              onChangeText={v => setCompleteForm({ ...completeForm, notes: v })}
            />

            <TouchableOpacity
              className="flex-row items-center justify-center p-4 mt-4 rounded-2xl"
              style={{ backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }}
              onPress={handleMarkCompleted}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="content-save-check"
                    size={22}
                    color="white"
                    style={{ marginRight: 10 }}
                  />
                  <Text className="text-white font-black">Submit & Complete Job</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View className="h-20" />
    </ScrollView>
  );
}

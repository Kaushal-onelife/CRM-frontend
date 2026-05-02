import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serviceAPI } from "../../services/api";
import DatePickerField from "../../components/DatePickerField";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

// Helper to determine display status for 'scheduled' services
function getDisplayStatus(service) {
  if (service.status !== "scheduled") return service.status;
  const today = new Date().toISOString().split("T")[0];
  return service.scheduled_date >= today ? "upcoming" : "due";
}

const STATUS_CONFIG = {
  upcoming: { color: "#2563EB", label: "UPCOMING" },
  due: { color: "#F97316", label: "DUE" },
  pending: { color: "#F59E0B", label: "PENDING" },
  completed: { color: "#10B981", label: "COMPLETED" },
  rejected: { color: "#EF4444", label: "REJECTED" },
  followup: { color: "#8B5CF6", label: "FOLLOW UP" },
};

export default function ServiceDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextContactDate, setNextContactDate] = useState("");
  const [showFollowupForm, setShowFollowupForm] = useState(false);

  const [error, setError] = useState(null);

  const fetchService = async () => {
    try {
      const data = await serviceAPI.getById(id);
      setService(data);
      setError(null);
    } catch (err) {
      console.error(err.message);
      setError(err.message || "Failed to load service");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchService();
    }, [id])
  );

  const handleStatusChange = async (newStatus, extraData = {}) => {
    try {
      await serviceAPI.update(id, { status: newStatus, ...extraData });
      fetchService();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleFollowup = async () => {
    const extra = {};
    if (nextContactDate) extra.next_contact_date = nextContactDate;
    await handleStatusChange("followup", extra);
    setShowFollowupForm(false);
    setNextContactDate("");
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>
          {error ? "Couldn't load service" : "Service not found"}
        </Text>
        {error ? <Text style={styles.errorMsg}>{error}</Text> : null}
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setLoading(true);
            fetchService();
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayStatus = getDisplayStatus(service);
  const statusInfo = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.upcoming;
  // Actions available for scheduled (upcoming/due), pending, followup
  const isActionable = ["scheduled", "pending", "followup"].includes(service.status);

  return (
    <ScrollView style={styles.container}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusInfo.color + "15" }]}>
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.label}
        </Text>
      </View>

      {/* Service Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service Details</Text>
        {[
          { label: "Type", value: service.service_type.replace(/_/g, " ") },
          { label: "Scheduled Date", value: service.scheduled_date },
          { label: "Completed Date", value: service.completed_date },
          { label: "Next Due Date", value: service.next_due_date },
          { label: "Next Contact", value: service.next_contact_date },
          { label: "Amount", value: service.amount > 0 ? `${parseFloat(service.amount).toFixed(2)}` : null },
          { label: "Service Charge", value: service.service_charge > 0 ? `${parseFloat(service.service_charge).toFixed(2)}` : null },
          { label: "Notes", value: service.notes },
        ]
          .filter((item) => item.value)
          .map((item) => (
            <View key={item.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}

        {/* Parts replaced */}
        {service.parts_replaced && service.parts_replaced.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.detailLabel}>Parts Replaced</Text>
            {service.parts_replaced.map((part, index) => (
              <Text key={index} style={styles.partText}>
                {part.name} x{part.quantity} - {parseFloat(part.cost).toFixed(2)}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Customer Info */}
      {service.customers && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <Text style={styles.customerName}>{service.customers.name}</Text>
          <Text style={styles.customerPhone}>{service.customers.phone}</Text>
          {service.customers.purifier_model && (
            <Text style={styles.customerDetail}>
              {service.customers.purifier_brand} - {service.customers.purifier_model}
            </Text>
          )}
          {service.customers.address && (
            <Text style={styles.customerAddress}>{service.customers.address}</Text>
          )}
          <View style={styles.contactActions}>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`tel:${service.customers.phone}`)}
            >
              <MaterialCommunityIcons name="phone" size={16} color={COLORS.primary} />
              <Text style={styles.contactBtnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => {
                const phone = service.customers.phone.replace(/\D/g, "");
                const number = phone.startsWith("91") ? phone : `91${phone}`;
                Linking.openURL(`whatsapp://send?phone=${number}`);
              }}
            >
              <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
              <Text style={styles.contactBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {isActionable && (
        <View style={styles.actionSection}>
          {/* Pending - customer accepted */}
          {(service.status === "scheduled" || service.status === "followup") && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.warning }]}
              onPress={() => handleStatusChange("pending")}
            >
              <MaterialCommunityIcons name="check" size={18} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Customer Accepted (Pending)</Text>
            </TouchableOpacity>
          )}

          {/* Complete - navigate to completion form */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
            onPress={() => navigation.navigate("CompleteService", { id: service.id })}
          >
            <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Mark as Completed</Text>
          </TouchableOpacity>

          {/* Follow Up */}
          {(service.status === "scheduled" || service.status === "followup") && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#8B5CF6" }]}
                onPress={() => setShowFollowupForm(!showFollowupForm)}
              >
                <MaterialCommunityIcons name="phone-return-outline" size={18} color={COLORS.white} />
                <Text style={styles.actionBtnText}>Mark as Follow Up</Text>
              </TouchableOpacity>

              {showFollowupForm && (
                <View style={styles.followupForm}>
                  <Text style={styles.label}>Next Contact Date (optional)</Text>
                  <DatePickerField
                    value={nextContactDate}
                    onChange={setNextContactDate}
                    placeholder="Pick a date"
                    minimumDate={new Date()}
                  />
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#8B5CF6", marginTop: 10 }]}
                    onPress={handleFollowup}
                  >
                    <Text style={styles.actionBtnText}>Confirm Follow Up</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Reject */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.danger }]}
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
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.white} />
            <Text style={styles.actionBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  statusBanner: {
    paddingVertical: 12,
    alignItems: "center",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    margin: SIZES.padding,
    marginBottom: 0,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    elevation: 1,
  },
  cardTitle: { ...FONTS.h3, marginBottom: 12 },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  detailLabel: { ...FONTS.regular, color: COLORS.gray, width: 130 },
  detailValue: { ...FONTS.regular, flex: 1, textTransform: "capitalize" },
  partText: { ...FONTS.regular, fontSize: 13, marginTop: 4, marginLeft: 8 },
  customerName: { ...FONTS.bold, fontSize: 16 },
  customerPhone: { ...FONTS.regular, color: COLORS.gray, marginTop: 2 },
  customerDetail: { ...FONTS.small, marginTop: 4, color: COLORS.gray },
  customerAddress: { ...FONTS.small, marginTop: 4 },
  contactActions: { flexDirection: "row", marginTop: 12, gap: 12 },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  contactBtnText: { ...FONTS.regular, fontSize: 13 },
  actionSection: {
    padding: SIZES.padding,
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: { color: COLORS.white, ...FONTS.bold },
  followupForm: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    elevation: 1,
  },
  label: { ...FONTS.medium, marginBottom: 6 },
  errorTitle: { ...FONTS.h3, color: COLORS.danger, marginBottom: 6 },
  errorMsg: {
    ...FONTS.regular,
    color: COLORS.gray,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: { color: COLORS.white, ...FONTS.bold },
});

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { serviceAPI } from "../../services/api";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

const STATUS_COLORS = {
  upcoming: COLORS.primary,
  pending: COLORS.warning,
  in_progress: "#8B5CF6",
  completed: COLORS.secondary,
  rejected: COLORS.danger,
  cancelled: COLORS.gray,
};

export default function ServiceDetailScreen({ route, navigation }) {
  const { id } = route.params;
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
      Alert.alert("Error", "Next due date must be YYYY-MM-DD format");
      return;
    }

    setSubmitting(true);
    try {
      await serviceAPI.markCompleted(id, {
        next_due_date: completeForm.next_due_date || null,
        amount: completeForm.amount ? parseFloat(completeForm.amount) : service.amount,
        notes: completeForm.notes || service.notes,
      });
      Alert.alert("Success", "Service marked as completed");
      setShowComplete(false);
      fetchService();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setSubmitting(false);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await serviceAPI.update(id, { status: newStatus });
      fetchService();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
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
        <Text>Service not found</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[service.status] || COLORS.gray;
  const isActive = ["upcoming", "pending", "in_progress"].includes(service.status);

  return (
    <ScrollView style={styles.container}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusColor + "15" }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {service.status.replace(/_/g, " ").toUpperCase()}
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
          { label: "Amount", value: service.amount ? `₹${service.amount}` : null },
          { label: "Notes", value: service.notes },
        ]
          .filter((item) => item.value)
          .map((item) => (
            <View key={item.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
      </View>

      {/* Customer Info */}
      {service.customers && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <Text style={styles.customerName}>{service.customers.name}</Text>
          <Text style={styles.customerPhone}>{service.customers.phone}</Text>
          {service.customers.address && (
            <Text style={styles.customerAddress}>
              {service.customers.address}
            </Text>
          )}
          <View style={styles.contactActions}>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`tel:${service.customers.phone}`)}
            >
              <Text style={styles.contactBtnText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => {
                const phone = service.customers.phone.replace(/\D/g, "");
                const number = phone.startsWith("91") ? phone : `91${phone}`;
                Linking.openURL(`whatsapp://send?phone=${number}`);
              }}
            >
              <Text style={styles.contactBtnText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {isActive && (
        <View style={styles.actionSection}>
          {service.status === "upcoming" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.warning }]}
              onPress={() => handleStatusChange("pending")}
            >
              <Text style={styles.actionBtnText}>Mark as Pending</Text>
            </TouchableOpacity>
          )}

          {service.status === "pending" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#8B5CF6" }]}
              onPress={() => handleStatusChange("in_progress")}
            >
              <Text style={styles.actionBtnText}>Start Service</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
            onPress={() => setShowComplete(!showComplete)}
          >
            <Text style={styles.actionBtnText}>Mark as Completed</Text>
          </TouchableOpacity>

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
            <Text style={styles.actionBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Complete Form */}
      {showComplete && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Complete Service</Text>

          <Text style={styles.label}>Next Due Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2026-07-23 (leave blank if none)"
            value={completeForm.next_due_date}
            onChangeText={(v) =>
              setCompleteForm({ ...completeForm, next_due_date: v })
            }
          />

          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder={String(service.amount || 0)}
            value={completeForm.amount}
            onChangeText={(v) =>
              setCompleteForm({ ...completeForm, amount: v })
            }
            keyboardType="numeric"
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: "top" }]}
            placeholder="Service notes..."
            value={completeForm.notes}
            onChangeText={(v) =>
              setCompleteForm({ ...completeForm, notes: v })
            }
            multiline
          />

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.secondary, marginTop: 16 }]}
            onPress={handleMarkCompleted}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.actionBtnText}>Confirm & Complete</Text>
            )}
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
  customerName: { ...FONTS.bold, fontSize: 16 },
  customerPhone: { ...FONTS.regular, color: COLORS.gray, marginTop: 2 },
  customerAddress: { ...FONTS.small, marginTop: 4 },
  contactActions: { flexDirection: "row", marginTop: 12, gap: 12 },
  contactBtn: {
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contactBtnText: { ...FONTS.regular, fontSize: 13 },
  actionSection: {
    padding: SIZES.padding,
    gap: 10,
  },
  actionBtn: {
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  actionBtnText: { color: COLORS.white, ...FONTS.bold },
  label: { ...FONTS.medium, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: COLORS.grayLight,
  },
});

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serviceAPI } from "../../services/api";
import { COLORS, FONTS, SIZES } from "../../constants/theme";
import ServiceHistoryModal from "../../components/ServiceHistoryModal";

const NEXT_DUE_OPTIONS = [
  { label: "1 Month", months: 1 },
  { label: "3 Months", months: 3 },
  { label: "4 Months", months: 4 },
  { label: "6 Months", months: 6 },
  { label: "1 Year", months: 12 },
  { label: "Custom", months: null },
  { label: "No Next Due", months: 0 },
];

const PAYMENT_METHODS = ["cash", "upi", "online"];

function addMonths(dateStr, months) {
  const d = new Date(dateStr || Date.now());
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export default function CompleteServiceScreen({ route, navigation }) {
  const { id: serviceId } = route.params;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Form state
  const [notes, setNotes] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [parts, setParts] = useState([]);
  const [selectedDueOption, setSelectedDueOption] = useState(null);
  const [customDueDate, setCustomDueDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const fetchService = async () => {
    try {
      const data = await serviceAPI.getById(serviceId);
      setService(data);
    } catch (error) {
      Alert.alert("Error", error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchService();
    }, [serviceId])
  );

  // Parts management
  const addPart = () => {
    setParts([...parts, { name: "", quantity: "1", cost: "" }]);
  };

  const updatePart = (index, field, value) => {
    const updated = [...parts];
    updated[index][field] = value;
    setParts(updated);
  };

  const removePart = (index) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  // Calculate totals
  const partsTotal = parts.reduce((sum, part) => {
    return sum + (parseFloat(part.cost) || 0) * (parseInt(part.quantity) || 1);
  }, 0);
  const charge = parseFloat(serviceCharge) || 0;
  const totalAmount = charge + partsTotal;

  // Compute next due date
  const getNextDueDate = () => {
    if (!selectedDueOption) return null;
    if (selectedDueOption.months === 0) return null;
    if (selectedDueOption.months === null) return customDueDate || null;
    return addMonths(new Date().toISOString().split("T")[0], selectedDueOption.months);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      const nextDueDate = getNextDueDate();

      const result = await serviceAPI.markCompleted(serviceId, {
        notes,
        service_charge: charge,
        parts_replaced: parts
          .filter((p) => p.name.trim())
          .map((p) => ({
            name: p.name.trim(),
            quantity: parseInt(p.quantity) || 1,
            cost: parseFloat(p.cost) || 0,
          })),
        next_due_date: nextDueDate,
        payment_status: paymentStatus,
        payment_method: paymentStatus === "paid" ? paymentMethod : null,
      });

      navigation.replace("ServiceSuccess", {
        serviceId,
        customerId: service.customer_id,
        customerName: service.customers?.name,
        customerPhone: service.customers?.phone,
        totalAmount,
        serviceCharge: charge,
        partsTotal,
        paymentStatus,
        paymentMethod: paymentStatus === "paid" ? paymentMethod : null,
        nextDueDate: nextDueDate,
      });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!service) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Customer Info */}
      <View style={styles.card}>
        <Text style={styles.customerName}>{service.customers?.name}</Text>
        <Text style={styles.customerDetail}>{service.customers?.phone}</Text>
        {service.customers?.purifier_model && (
          <Text style={styles.customerDetail}>
            {service.customers.purifier_brand} - {service.customers.purifier_model}
          </Text>
        )}

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => setShowHistory(true)}
        >
          <MaterialCommunityIcons name="history" size={18} color={COLORS.primary} />
          <Text style={styles.historyBtnText}>View Past Services</Text>
        </TouchableOpacity>
      </View>

      {/* Work Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Work Details</Text>

        <Text style={styles.label}>Notes - What was done</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          placeholder="Describe the work performed..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      {/* Parts Replaced */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parts Replaced</Text>

        {parts.map((part, index) => (
          <View key={index} style={styles.partRow}>
            <View style={styles.partFields}>
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="Part name"
                value={part.name}
                onChangeText={(v) => updatePart(index, "name", v)}
              />
              <TextInput
                style={[styles.input, { flex: 0.5, marginHorizontal: 6 }]}
                placeholder="Qty"
                value={part.quantity}
                onChangeText={(v) => updatePart(index, "quantity", v)}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Cost"
                value={part.cost}
                onChangeText={(v) => updatePart(index, "cost", v)}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.removePartBtn}
                onPress={() => removePart(index)}
              >
                <MaterialCommunityIcons name="close-circle" size={22} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addPartBtn} onPress={addPart}>
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.addPartText}>Add Part</Text>
        </TouchableOpacity>
      </View>

      {/* Charges */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Charges</Text>

        <Text style={styles.label}>Service Charge</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          value={serviceCharge}
          onChangeText={setServiceCharge}
          keyboardType="numeric"
        />

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Service Charge</Text>
            <Text style={styles.totalValue}>{charge.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Parts Total</Text>
            <Text style={styles.totalValue}>{partsTotal.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>{totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Next Due */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next Due</Text>

        <View style={styles.dueOptions}>
          {NEXT_DUE_OPTIONS.map((option) => {
            const isSelected = selectedDueOption?.label === option.label;
            return (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.dueChip,
                  isSelected && styles.dueChipActive,
                ]}
                onPress={() => setSelectedDueOption(option)}
              >
                <Text
                  style={[
                    styles.dueChipText,
                    isSelected && styles.dueChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDueOption?.months === null && (
          <>
            <Text style={styles.label}>Custom Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2026-09-27"
              value={customDueDate}
              onChangeText={setCustomDueDate}
            />
          </>
        )}

        {selectedDueOption && selectedDueOption.months !== 0 && selectedDueOption.months !== null && (
          <Text style={styles.dueDatePreview}>
            Next service: {addMonths(new Date().toISOString().split("T")[0], selectedDueOption.months)}
          </Text>
        )}
      </View>

      {/* Payment */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment</Text>

        <View style={styles.paymentStatusRow}>
          <TouchableOpacity
            style={[
              styles.paymentChip,
              paymentStatus === "paid" && { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
            ]}
            onPress={() => setPaymentStatus("paid")}
          >
            <Text style={[styles.paymentChipText, paymentStatus === "paid" && { color: COLORS.white }]}>
              Paid
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentChip,
              paymentStatus === "unpaid" && { backgroundColor: COLORS.warning, borderColor: COLORS.warning },
            ]}
            onPress={() => setPaymentStatus("unpaid")}
          >
            <Text style={[styles.paymentChipText, paymentStatus === "unpaid" && { color: COLORS.white }]}>
              Unpaid
            </Text>
          </TouchableOpacity>
        </View>

        {paymentStatus === "paid" && (
          <>
            <Text style={[styles.label, { marginTop: 12 }]}>Payment Method</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodChip,
                    paymentMethod === method && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.methodChipText,
                      paymentMethod === method && { color: COLORS.white },
                    ]}
                  >
                    {method.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={styles.completeBtn}
        onPress={handleComplete}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.white} />
            <Text style={styles.completeBtnText}>Complete Service</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* History Modal */}
      {service.customer_id && (
        <ServiceHistoryModal
          visible={showHistory}
          onClose={() => setShowHistory(false)}
          customerId={service.customer_id}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: 12,
    elevation: 1,
  },
  cardTitle: { ...FONTS.h3, marginBottom: 12 },
  customerName: { ...FONTS.bold, fontSize: 18 },
  customerDetail: { ...FONTS.regular, color: COLORS.gray, marginTop: 2 },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  historyBtnText: {
    ...FONTS.medium,
    color: COLORS.primary,
    fontSize: 14,
    marginLeft: 6,
  },
  label: { ...FONTS.medium, fontSize: 14, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: COLORS.grayLight,
  },
  partRow: { marginBottom: 8 },
  partFields: {
    flexDirection: "row",
    alignItems: "center",
  },
  removePartBtn: { marginLeft: 6, padding: 4 },
  addPartBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
  },
  addPartText: { ...FONTS.medium, color: COLORS.primary, marginLeft: 6, fontSize: 14 },
  totalSection: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.grayBorder },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: { ...FONTS.regular, color: COLORS.gray },
  totalValue: { ...FONTS.regular },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
  },
  grandTotalLabel: { ...FONTS.bold, fontSize: 16 },
  grandTotalValue: { ...FONTS.bold, fontSize: 16, color: COLORS.primary },
  dueOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dueChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.grayLight,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  dueChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dueChipText: { ...FONTS.small, fontSize: 13, fontWeight: "500" },
  dueChipTextActive: { color: COLORS.white, fontWeight: "600" },
  dueDatePreview: {
    ...FONTS.regular,
    color: COLORS.primary,
    marginTop: 10,
    fontWeight: "500",
  },
  paymentStatusRow: { flexDirection: "row", gap: 10 },
  paymentChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    alignItems: "center",
  },
  paymentChipText: { ...FONTS.medium, fontSize: 14 },
  methodRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  methodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  methodChipText: { ...FONTS.small, fontSize: 13, fontWeight: "500" },
  completeBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    elevation: 2,
  },
  completeBtnText: {
    color: COLORS.white,
    ...FONTS.bold,
    fontSize: 16,
    marginLeft: 8,
  },
});

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serviceAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import ServiceHistoryModal from "../../components/ServiceHistoryModal";
import DatePickerField from "../../components/DatePickerField";
import { Card, Button, Skeleton, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import { isRequired, isNonNegativeNumber, maxLength } from "../../utils/validators";

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
  const { colors, spacing, radius } = useTheme();
  const queryClient = useQueryClient();
  const toast = useToast();
  const serviceId = route.params?.id;
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
  // Inline validation errors: notes, serviceCharge, and per-part errors keyed by index.
  const [notesError, setNotesError] = useState(null);
  const [chargeError, setChargeError] = useState(null);
  const [partErrors, setPartErrors] = useState({});

  const fetchService = async () => {
    try {
      const data = await serviceAPI.getById(serviceId);
      setService(data);
    } catch (error) {
      toast.error(error.message || "Something went wrong");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!serviceId) {
        toast.error("Missing service ID");
        navigation.goBack();
        return;
      }
      fetchService();
    }, [serviceId])
  );

  // Parts management
  const addPart = () => {
    setParts([...parts, { name: "", quantity: "1", cost: "" }]);
  };

  const updatePart = (index, field, value) => {
    let v = value;
    // Qty: digits only. Cost: numeric (digits + decimal point). Name: free text.
    if (field === "quantity") v = v.replace(/[^0-9]/g, "");
    else if (field === "cost") v = v.replace(/[^0-9.]/g, "");
    const updated = [...parts];
    updated[index][field] = v;
    setParts(updated);
    if (partErrors[index]?.[field]) {
      setPartErrors((prev) => ({ ...prev, [index]: { ...prev[index], [field]: null } }));
    }
  };

  // Validate a single part field — returns an error string or null.
  const validatePartField = (field, part) => {
    switch (field) {
      case "name":
        // Name required only when the row carries a qty/cost value.
        if (!part.name.trim() && (part.cost?.trim() || (part.quantity?.trim() && part.quantity !== "1"))) {
          return isRequired("", "Part name");
        }
        return null;
      case "quantity":
        return isNonNegativeNumber(part.quantity || "0", "Qty");
      case "cost":
        return isNonNegativeNumber(part.cost || "0", "Cost");
      default:
        return null;
    }
  };

  const handlePartBlur = (index, field) => {
    const err = validatePartField(field, parts[index]);
    setPartErrors((prev) => ({ ...prev, [index]: { ...prev[index], [field]: err } }));
  };

  const removePart = (index) => {
    setParts(parts.filter((_, i) => i !== index));
    setPartErrors((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        const i = Number(k);
        if (i < index) next[i] = prev[k];
        else if (i > index) next[i - 1] = prev[k];
      });
      return next;
    });
  };

  // Calculate totals
  const partsTotal = parts.reduce((sum, part) => {
    return sum + (parseFloat(part.cost) || 0) * (parseInt(part.quantity) || 1);
  }, 0);
  const charge = parseFloat(serviceCharge) || 0;
  const totalAmount = charge + partsTotal;

  // Compute next due date.
  //   months === 0    -> "No Next Due"  -> null
  //   months === null -> "Custom"       -> use customDueDate (or null until picked)
  //   months > 0      -> N months from today
  const getNextDueDate = () => {
    if (!selectedDueOption) return null;
    const { months } = selectedDueOption;
    if (months === 0) return null;
    if (months === null) return customDueDate || null;
    return addMonths(new Date().toISOString().split("T")[0], months);
  };
  const nextDuePreview = getNextDueDate();

  const handleComplete = async () => {
    if (!requireOnline()) return;
    // Inline validation for typed fields — collect all so they light up at once.
    const nErr = maxLength(notes.trim(), 1000, "Notes");
    const cErr = isNonNegativeNumber(serviceCharge || "0", "Service charge");
    const nextPartErrors = {};
    let hasPartError = false;
    parts.forEach((part, i) => {
      const rowErr = {};
      for (const field of ["name", "quantity", "cost"]) {
        const err = validatePartField(field, part);
        if (err) {
          rowErr[field] = err;
          hasPartError = true;
        }
      }
      if (Object.keys(rowErr).length > 0) nextPartErrors[i] = rowErr;
    });
    setNotesError(nErr);
    setChargeError(cErr);
    setPartErrors(nextPartErrors);
    if (nErr || cErr || hasPartError) return;

    if (selectedDueOption?.months === null && !customDueDate) {
      toast.error("Please pick a custom due date.");
      return;
    }
    setSubmitting(true);
    try {
      const nextDueDate = nextDuePreview;

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

      // Completing a service can generate a bill and changes the dashboard/reminders.
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });

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
      toast.error(error.message || "Something went wrong");
    }
    setSubmitting(false);
  };

  const cardTitleStyle = { color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: spacing.md };
  const labelStyle = { color: colors.textSecondary, fontSize: 13, fontWeight: "500", marginBottom: spacing.xs };

  // Reusable themed single-line input style for compact part/charge fields.
  const fieldStyle = {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    // Strip the web browser's default black input outline on focus.
    outlineStyle: "none",
    outlineWidth: 0,
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
        <Skeleton width="100%" height={110} radius={radius.lg} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={130} radius={radius.lg} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={150} radius={radius.lg} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={56} radius={radius.md} />
      </View>
    );
  }

  if (!service) return null;

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      enableOnAndroid
      extraScrollHeight={20}
    >
        {/* Customer Info */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
            {service.customers?.name}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
            {service.customers?.phone}
          </Text>
          {service.customers?.purifier_model && (
            <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
              {service.customers.purifier_brand} - {service.customers.purifier_model}
            </Text>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              backgroundColor: colors.primarySoft,
              borderRadius: radius.md,
              alignSelf: "flex-start",
            }}
            onPress={() => setShowHistory(true)}
          >
            <MaterialCommunityIcons name="history" size={18} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600", marginLeft: spacing.xs }}>
              View Past Services
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Work Details */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={cardTitleStyle}>Work Details</Text>
          <Text style={labelStyle}>Notes - What was done</Text>
          <TextInput
            placeholder="Describe the work performed..."
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={(v) => {
              setNotes(v.slice(0, 1000));
              if (notesError) setNotesError(null);
            }}
            onBlur={() => setNotesError(maxLength(notes.trim(), 1000, "Notes"))}
            underlineColorAndroid="transparent"
            multiline
            textAlignVertical="top"
            style={[
              fieldStyle,
              { height: 90, paddingVertical: spacing.md },
              notesError && { borderColor: colors.danger },
            ]}
          />
          {notesError ? (
            <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{notesError}</Text>
          ) : null}
        </Card>

        {/* Parts Replaced */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={cardTitleStyle}>Parts Replaced</Text>

          {parts.map((part, index) => (
            <View
              key={index}
              style={{
                marginBottom: spacing.md,
                padding: spacing.md,
                backgroundColor: colors.background,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <TextInput
                placeholder="Part name"
                placeholderTextColor={colors.textMuted}
                value={part.name}
                onChangeText={(v) => updatePart(index, "name", v)}
                onBlur={() => handlePartBlur(index, "name")}
                underlineColorAndroid="transparent"
                style={[fieldStyle, partErrors[index]?.name && { borderColor: colors.danger }]}
              />
              {partErrors[index]?.name ? (
                <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>
                  {partErrors[index].name}
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: spacing.sm, gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={[labelStyle, { fontSize: 12 }]}>Qty</Text>
                  <TextInput
                    placeholder="1"
                    placeholderTextColor={colors.textMuted}
                    value={part.quantity}
                    onChangeText={(v) => updatePart(index, "quantity", v)}
                    onBlur={() => handlePartBlur(index, "quantity")}
                    underlineColorAndroid="transparent"
                    keyboardType="numeric"
                    style={[fieldStyle, partErrors[index]?.quantity && { borderColor: colors.danger }]}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={[labelStyle, { fontSize: 12 }]}>Cost</Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={part.cost}
                    onChangeText={(v) => updatePart(index, "cost", v)}
                    onBlur={() => handlePartBlur(index, "cost")}
                    underlineColorAndroid="transparent"
                    keyboardType="numeric"
                    style={[fieldStyle, partErrors[index]?.cost && { borderColor: colors.danger }]}
                  />
                </View>
                <TouchableOpacity
                  style={{ padding: spacing.xs, marginBottom: spacing.xs }}
                  onPress={() => removePart(index)}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
              {partErrors[index]?.quantity || partErrors[index]?.cost ? (
                <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>
                  {partErrors[index]?.quantity || partErrors[index]?.cost}
                </Text>
              ) : null}
            </View>
          ))}

          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.sm, padding: spacing.sm }}
            onPress={addPart}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: "600", marginLeft: spacing.xs, fontSize: 14 }}>
              Add Part
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Charges */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={cardTitleStyle}>Charges</Text>

          <Text style={labelStyle}>Service Charge</Text>
          <TextInput
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            value={serviceCharge}
            onChangeText={(v) => {
              setServiceCharge(v.replace(/[^0-9.]/g, ""));
              if (chargeError) setChargeError(null);
            }}
            onBlur={() => setChargeError(isNonNegativeNumber(serviceCharge || "0", "Service charge"))}
            underlineColorAndroid="transparent"
            keyboardType="numeric"
            style={[fieldStyle, chargeError && { borderColor: colors.danger }]}
          />
          {chargeError ? (
            <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{chargeError}</Text>
          ) : null}

          <View style={{ marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Service Charge</Text>
              <Text style={{ color: colors.text, fontSize: 14 }}>₹{charge.toFixed(2)}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Parts Total</Text>
              <Text style={{ color: colors.text, fontSize: 14 }}>₹{partsTotal.toFixed(2)}</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: spacing.sm,
                paddingTop: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: colors.divider,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Total Amount</Text>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "700" }}>₹{totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </Card>

        {/* Next Due */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={cardTitleStyle}>Next Due</Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {NEXT_DUE_OPTIONS.map((option) => {
              const isSelected = selectedDueOption?.label === option.label;
              return (
                <TouchableOpacity
                  key={option.label}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.full,
                    borderWidth: 1,
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }}
                  onPress={() => setSelectedDueOption(option)}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? "600" : "500",
                      color: isSelected ? colors.onPrimary : colors.textSecondary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedDueOption?.months === null && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={labelStyle}>Custom Date</Text>
              <DatePickerField
                value={customDueDate}
                onChange={setCustomDueDate}
                placeholder="Pick a custom date"
                minimumDate={new Date()}
              />
            </View>
          )}

          {nextDuePreview && (
            <Text style={{ color: colors.primary, marginTop: spacing.md, fontWeight: "600" }}>
              Next service: {nextDuePreview}
            </Text>
          )}
        </Card>

        {/* Payment */}
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={cardTitleStyle}>Payment</Text>

          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                alignItems: "center",
                backgroundColor: paymentStatus === "paid" ? colors.success : colors.background,
                borderColor: paymentStatus === "paid" ? colors.success : colors.border,
              }}
              onPress={() => setPaymentStatus("paid")}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: paymentStatus === "paid" ? colors.onPrimary : colors.textSecondary,
                }}
              >
                Paid
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                alignItems: "center",
                backgroundColor: paymentStatus === "unpaid" ? colors.warning : colors.background,
                borderColor: paymentStatus === "unpaid" ? colors.warning : colors.border,
              }}
              onPress={() => setPaymentStatus("unpaid")}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: paymentStatus === "unpaid" ? colors.onPrimary : colors.textSecondary,
                }}
              >
                Unpaid
              </Text>
            </TouchableOpacity>
          </View>

          {paymentStatus === "paid" && (
            <>
              <Text style={[labelStyle, { marginTop: spacing.md }]}>Payment Method</Text>
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs }}>
                {PAYMENT_METHODS.map((method) => {
                  const active = paymentMethod === method;
                  return (
                    <TouchableOpacity
                      key={method}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.sm,
                        borderRadius: radius.full,
                        borderWidth: 1,
                        backgroundColor: active ? colors.primary : colors.background,
                        borderColor: active ? colors.primary : colors.border,
                      }}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: active ? "600" : "500",
                          color: active ? colors.onPrimary : colors.textSecondary,
                        }}
                      >
                        {method.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </Card>

        {/* Submit */}
        <Button
          title="Complete Service"
          icon="check-circle"
          variant="success"
          size="lg"
          onPress={handleComplete}
          loading={submitting}
          disabled={submitting}
        />

        <View style={{ height: 40 }} />

        {/* History Modal */}
        {service.customer_id && (
          <ServiceHistoryModal
            visible={showHistory}
            onClose={() => setShowHistory(false)}
            customerId={service.customer_id}
          />
        )}
    </KeyboardAwareScrollView>
  );
}

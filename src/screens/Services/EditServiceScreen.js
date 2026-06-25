import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useQueryClient } from "@tanstack/react-query";
import { serviceAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import DatePickerField from "../../components/DatePickerField";
import { Input, Button, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

// One-off service types. AMC visits keep their type fixed (it's tied to the
// contract), so the type picker is hidden for them.
const SERVICE_TYPES = ["installation", "repair", "filter_change", "general_service"];

// Edit a not-yet-completed service: type, scheduled date, amount, notes. Customer
// is fixed (re-assigning would orphan history). Status is changed via the detail
// screen's action buttons, and completed services are locked from editing.
export default function EditServiceScreen({ route, navigation }) {
  const { colors, spacing, radius } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const service = route.params?.service || {};
  const isAmcVisit = !!service.amc_id;

  const [serviceType, setServiceType] = useState(service.service_type || "general_service");
  const [scheduledDate, setScheduledDate] = useState(service.scheduled_date || "");
  const [amount, setAmount] = useState(service.amount != null ? String(service.amount) : "");
  const [notes, setNotes] = useState(service.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!requireOnline()) return;
    if (!scheduledDate) {
      toast.error("Please pick a scheduled date.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        scheduled_date: scheduledDate,
        amount: parseFloat(amount) || 0,
        notes: notes.trim() || null,
      };
      // Don't change the type of an AMC visit.
      if (!isAmcVisit) body.service_type = serviceType;

      await serviceAPI.update(service.id, body);
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["service", service.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Service updated");
      navigation.goBack();
    } catch (error) {
      toast.error(error.message || "Couldn't save. Please try again.");
    }
    setSaving(false);
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Customer (read-only) */}
      {service.customers?.name && (
        <View style={[styles.lockedRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.lockedLabel, { color: colors.textSecondary }]}>Customer</Text>
          <Text style={[styles.lockedValue, { color: colors.text }]}>{service.customers.name}</Text>
        </View>
      )}

      {/* Service type — hidden for AMC visits (type is fixed by the contract). */}
      {!isAmcVisit && (
        <>
          <Text style={[styles.label, { color: colors.text }]}>Service Type</Text>
          <View style={styles.typeGrid}>
            {SERVICE_TYPES.map((t) => {
              const active = serviceType === t;
              return (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.7}
                  onPress={() => setServiceType(t)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.onPrimary : colors.textSecondary,
                      fontWeight: active ? "700" : "500",
                      fontSize: 13,
                      textTransform: "capitalize",
                    }}
                  >
                    {t.replace(/_/g, " ")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Scheduled Date</Text>
      <DatePickerField value={scheduledDate} onChange={setScheduledDate} />

      <View style={{ height: 14 }} />
      <Input
        label="Amount (₹)"
        icon="currency-inr"
        value={amount}
        onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
        placeholder="0"
        keyboardType="numeric"
      />
      <Input
        label="Notes"
        value={notes}
        onChangeText={(v) => setNotes(v.slice(0, 500))}
        placeholder="Any additional notes"
        multiline
      />

      <Button
        title="Save Changes"
        icon="content-save-outline"
        onPress={handleSave}
        loading={saving}
        disabled={saving}
        style={{ marginTop: 8 }}
      />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "500", marginBottom: 8 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  lockedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  lockedLabel: { fontSize: 13, fontWeight: "500" },
  lockedValue: { fontSize: 15, fontWeight: "600" },
});

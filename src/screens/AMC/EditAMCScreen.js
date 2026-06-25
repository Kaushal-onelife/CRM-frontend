import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useQueryClient } from "@tanstack/react-query";
import { amcAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import { Input, Button, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

// Edit only the SAFE fields of an AMC: plan name, amount, notes. Dates, number
// of services and customer are intentionally not editable here — they drive the
// already-scheduled visits, so changing them in place would desync the data.
// (Fix those by deleting & recreating, or renewing.)
export default function EditAMCScreen({ route, navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const contract = route.params?.contract || {};

  const [planName, setPlanName] = useState(contract.plan_name || "");
  const [amount, setAmount] = useState(
    contract.amount != null ? String(contract.amount) : ""
  );
  const [notes, setNotes] = useState(contract.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!requireOnline()) return;
    if (!planName.trim()) {
      toast.error("Plan name can't be empty.");
      return;
    }
    setSaving(true);
    try {
      await amcAPI.update(contract.id, {
        plan_name: planName.trim(),
        amount: parseFloat(amount) || 0,
        notes: notes.trim() || null,
      });
      queryClient.invalidateQueries({ queryKey: ["amc"] });
      queryClient.invalidateQueries({ queryKey: ["amc", contract.id] });
      toast.success("AMC updated");
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
      <Input
        label="Plan Name"
        value={planName}
        onChangeText={setPlanName}
        placeholder="e.g. Annual Premium (6 services)"
      />
      <Input
        label="Contract Amount (₹)"
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

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Dates, number of services and customer can't be edited — they're tied to
        the scheduled visits. To change those, delete and recreate the contract.
      </Text>

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
  hint: { fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 16 },
});

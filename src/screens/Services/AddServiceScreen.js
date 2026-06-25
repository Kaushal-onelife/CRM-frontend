import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useQueryClient } from "@tanstack/react-query";
import { customerAPI, serviceAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import DatePickerField from "../../components/DatePickerField";
import { Input, Button, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import {
  isRequired,
  isNonNegativeNumber,
  maxLength,
  firstError,
} from "../../utils/validators";

// Note: 'amc' is intentionally NOT here. AMC visits must come from creating an
// AMC Contract (which auto-schedules + links them via amc_id) — picking 'amc'
// as a one-off service type would create an orphan visit with no contract that
// never shows in the AMC list or counts toward a contract.
const SERVICE_TYPES = [
  "installation",
  "repair",
  "filter_change",
  "general_service",
];

export default function AddServiceScreen({ navigation, route }) {
  const { colors, spacing, radius } = useTheme();
  const queryClient = useQueryClient();
  const toast = useToast();
  const preselectedCustomerId = route.params?.customerId;
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(
    preselectedCustomerId || null
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [serviceType, setServiceType] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!preselectedCustomerId) {
      fetchCustomers();
    }
  }, []);

  const fetchCustomers = async (search = "") => {
    setSearching(true);
    try {
      const params = search ? `search=${search}` : "";
      const result = await customerAPI.getAll(params);
      setCustomers(result.customers || []);
    } catch (error) {
      console.error(error.message);
      setCustomers([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!requireOnline()) return;
    if (!selectedCustomer) {
      toast.error("Please select a customer from the search results.");
      return;
    }

    const trimmedNotes = notes.trim();
    // Inline field errors for service type / date so they highlight under the field.
    const nextErrors = {};
    const typeErr = isRequired(serviceType, "Service type");
    const dateErr = isRequired(scheduledDate, "Scheduled date");
    const amountErr = isNonNegativeNumber(amount || "0", "Amount");
    const notesErr = maxLength(trimmedNotes, 500, "Notes");
    if (typeErr) nextErrors.serviceType = typeErr;
    if (dateErr) nextErrors.scheduledDate = dateErr;
    if (amountErr) nextErrors.amount = amountErr;
    if (notesErr) nextErrors.notes = notesErr;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await serviceAPI.create({
        customer_id: selectedCustomer,
        service_type: serviceType,
        scheduled_date: scheduledDate,
        amount: amount ? parseFloat(amount) : 0,
        notes: trimmedNotes,
      });
      // Refresh the lists this new service affects so it shows immediately.
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Service scheduled successfully");
      navigation.goBack();
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
    setLoading(false);
  };

  // Consistent vertical rhythm: every field group is separated by spacing.lg (16).
  const labelStyle = {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
    >
      {/* Customer Selection */}
      {!preselectedCustomerId && (
        <>
          <Input
            label="Select Customer *"
            icon="account-search-outline"
            placeholder="Search customer by name or phone..."
            value={customerSearch}
            style={{ marginBottom: 0, marginTop: spacing.xs }}
            autoCapitalize="words"
            onChangeText={(text) => {
              setCustomerSearch(text);
              // Editing search clears selection so user can't submit a stale customer
              if (selectedCustomer) setSelectedCustomer(null);
              if (text.length > 2) {
                setShowDropdown(true);
                fetchCustomers(text);
              } else {
                setShowDropdown(false);
              }
            }}
          />

          {selectedCustomer && !showDropdown && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: colors.successSoft,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                marginTop: spacing.sm,
              }}
            >
              <Text style={{ color: colors.success, fontSize: 13, fontWeight: "600" }}>
                ✓ Customer selected
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedCustomer(null);
                  setCustomerSearch("");
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>Change</Text>
              </TouchableOpacity>
            </View>
          )}

          {showDropdown && customerSearch.length > 2 && (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: spacing.xs,
                maxHeight: 180,
                overflow: "hidden",
              }}
            >
              {searching ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ padding: spacing.md }}
                />
              ) : customers.length === 0 ? (
                <Text style={{ color: colors.textSecondary, padding: spacing.md, textAlign: "center" }}>
                  No customers found
                </Text>
              ) : (
                customers.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={{
                      padding: spacing.md,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.divider,
                      backgroundColor: selectedCustomer === c.id ? colors.primarySoft : "transparent",
                    }}
                    onPress={() => {
                      setSelectedCustomer(c.id);
                      setCustomerSearch(`${c.name} - ${c.phone}`);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 14 }}>
                      {c.name} - {c.phone}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </>
      )}

      {/* Service Type */}
      <Text style={labelStyle}>Service Type *</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {SERVICE_TYPES.map((type) => {
          const active = serviceType === type;
          return (
            <TouchableOpacity
              key={type}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                borderWidth: 1,
                backgroundColor: active ? colors.primary : colors.card,
                borderColor: active ? colors.primary : colors.border,
              }}
              onPress={() => {
                setServiceType(type);
                if (errors.serviceType) setErrors((p) => ({ ...p, serviceType: null }));
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  textTransform: "capitalize",
                  fontWeight: active ? "600" : "500",
                  color: active ? colors.onPrimary : colors.textSecondary,
                }}
              >
                {type.replace(/_/g, " ")}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {errors.serviceType ? (
        <Text style={{ color: colors.danger, fontSize: 12, marginTop: spacing.xs }}>
          {errors.serviceType}
        </Text>
      ) : null}

      {/* Date */}
      <View style={{ marginTop: spacing.md }}>
        <DatePickerField
          label="Scheduled Date *"
          value={scheduledDate}
          onChange={(d) => {
            setScheduledDate(d);
            if (errors.scheduledDate) setErrors((p) => ({ ...p, scheduledDate: null }));
          }}
          placeholder="Select scheduled date"
          minDate={new Date()}
        />
        {errors.scheduledDate ? (
          <Text style={{ color: colors.danger, fontSize: 12, marginTop: spacing.xs }}>
            {errors.scheduledDate}
          </Text>
        ) : null}
      </View>

      {/* Amount */}
      <Input
        label="Amount (optional)"
        icon="currency-inr"
        placeholder="0"
        value={amount}
        error={errors.amount}
        onChangeText={(t) => {
          setAmount(t.replace(/[^0-9.]/g, ""));
          if (errors.amount) setErrors((p) => ({ ...p, amount: null }));
        }}
        keyboardType="numeric"
        style={{ marginBottom: 0, marginTop: spacing.lg }}
      />

      {/* Notes */}
      <Text style={labelStyle}>Notes</Text>
      <TextInput
        placeholder="Any additional notes"
        placeholderTextColor={colors.textMuted}
        value={notes}
        onChangeText={(t) => {
          setNotes(t);
          if (errors.notes) setErrors((p) => ({ ...p, notes: null }));
        }}
        multiline
        textAlignVertical="top"
        underlineColorAndroid="transparent"
        style={{
          borderWidth: 1.5,
          borderColor: errors.notes ? colors.danger : colors.border,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          paddingHorizontal: 14,
          paddingVertical: spacing.md,
          minHeight: 90,
          color: colors.text,
          fontSize: 15,
          outlineStyle: "none",
          outlineWidth: 0,
        }}
      />
      {errors.notes ? (
        <Text style={{ color: colors.danger, fontSize: 12, marginTop: spacing.xs }}>
          {errors.notes}
        </Text>
      ) : null}

      <Button
        title="Schedule Service"
        icon="calendar-check"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={{ marginTop: spacing["2xl"] }}
      />
    </KeyboardAwareScrollView>
  );
}

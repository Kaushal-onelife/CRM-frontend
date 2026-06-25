import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useQueryClient } from "@tanstack/react-query";
import { customerAPI, amcAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import { confirm } from "../../utils/confirm";
import DatePickerField from "../../components/DatePickerField";
import { Input, Button, Card, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import {
  isRequired,
  isIntegerInRange,
  isNonNegativeNumber,
  isDateAfter,
  maxLength,
} from "../../utils/validators";

const PLAN_PRESETS = [
  { name: "Annual Basic (4 services)", services: 4, months: 12 },
  { name: "Annual Premium (6 services)", services: 6, months: 12 },
  { name: "Half-Yearly (2 services)", services: 2, months: 6 },
  { name: "Custom", services: 0, months: 0 },
];

export default function CreateAMCScreen({ route, navigation }) {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const preCustomerId = route.params?.customerId;
  // Renewal mode: when renewFrom is set we call amcAPI.renew(oldId,...) instead
  // of create, and the form is prefilled from the old contract.
  const renewFrom = route.params?.renewFrom || null;
  const prefill = route.params?.prefill || null;
  const renewCustomerName = route.params?.customerName;

  // Default the new start to the day AFTER the old contract's end (continuous
  // coverage); the owner can change it.
  const dayAfter = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(preCustomerId || null);
  const [customerSearch, setCustomerSearch] = useState(renewCustomerName || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(prefill ? "Custom" : null);
  const [planName, setPlanName] = useState(prefill?.plan_name || "");
  const [startDate, setStartDate] = useState(prefill ? dayAfter(prefill.start_date) : "");
  const [endDate, setEndDate] = useState("");
  const [totalServices, setTotalServices] = useState(prefill?.total_services || "4");
  const [amount, setAmount] = useState(prefill?.amount || "");
  const [autoSchedule, setAutoSchedule] = useState(true);
  // Most AMC customers pay upfront -> default Paid. A bill is auto-generated on
  // submit (paid or unpaid) so the customer always has a record.
  const [isPaid, setIsPaid] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState(prefill?.notes || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reflect renewal vs new-contract mode in the header title.
  useEffect(() => {
    navigation.setOptions({ title: renewFrom ? "Renew AMC" : "New AMC Contract" });
  }, [renewFrom, navigation]);

  // Per-field validation — returns an error string or null. Used on blur + submit.
  const validateField = (key, value) => {
    const v = (value || "").trim();
    switch (key) {
      case "planName":
        return isRequired(v, "Plan name") || maxLength(v, 100, "Plan name");
      case "startDate":
        return isRequired(v, "Start date");
      case "endDate":
        return isRequired(v, "End date") || isDateAfter(v, startDate, "End date");
      // total_services must be 1-52: catches "0", negatives, NaN, and absurd values
      // that would create thousands of phantom services if auto_schedule is on.
      case "totalServices":
        return isIntegerInRange(v, 1, 52, "Total services");
      case "amount":
        return isNonNegativeNumber(v || "0", "Amount");
      case "notes":
        return maxLength(v, 500, "Notes");
      default:
        return null;
    }
  };

  const clearError = (key) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleBlur = (key, value) => {
    setErrors((prev) => ({ ...prev, [key]: validateField(key, value) }));
  };

  useEffect(() => {
    if (!preCustomerId) fetchCustomers();
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

  const selectPlan = (preset) => {
    setSelectedPlan(preset.name);
    if (preset.name !== "Custom") {
      setPlanName(preset.name);
      setTotalServices(String(preset.services));
      setErrors((prev) => ({ ...prev, planName: null, totalServices: null }));
      if (startDate) {
        const start = new Date(startDate);
        start.setMonth(start.getMonth() + preset.months);
        setEndDate(formatDate(start));
        setErrors((prev) => ({ ...prev, endDate: null }));
      }
    }
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    setErrors((prev) => ({ ...prev, startDate: null }));
    // Auto-calculate end date based on selected plan
    const preset = PLAN_PRESETS.find((p) => p.name === selectedPlan);
    if (preset && preset.months > 0) {
      const start = new Date(date);
      start.setMonth(start.getMonth() + preset.months);
      setEndDate(formatDate(start));
      setErrors((prev) => ({ ...prev, endDate: null }));
    }
  };

  const handleSubmit = async () => {
    if (!requireOnline()) return;
    if (!selectedCustomer) {
      toast.error("Please select a customer.");
      return;
    }

    const trimmedPlan = planName.trim();
    const trimmedNotes = notes.trim();

    // Validate every field; collect all errors so they all light up at once.
    const fieldValues = {
      planName,
      startDate,
      endDate,
      totalServices,
      amount,
      notes,
    };
    const nextErrors = {};
    for (const [key, value] of Object.entries(fieldValues)) {
      const err = validateField(key, value);
      if (err) nextErrors[key] = err;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const body = {
        customer_id: selectedCustomer,
        plan_name: trimmedPlan,
        start_date: startDate,
        end_date: endDate,
        total_services: parseInt(totalServices, 10),
        amount: parseFloat(amount) || 0,
        auto_schedule: autoSchedule,
        payment_status: isPaid ? "paid" : "unpaid",
        payment_method: isPaid ? paymentMethod : null,
        notes: trimmedNotes,
      };

      // Both create + renew return the new contract plus the auto-generated
      // bill (or bill: null when amount was 0 / billing failed).
      const result = renewFrom
        ? await amcAPI.renew(renewFrom, body)
        : await amcAPI.create(body);

      // Refresh AMC list, services (auto-schedule), bills (auto-generated AMC
      // bill), dashboard and reminders.
      queryClient.invalidateQueries({ queryKey: ["amc"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success(
        renewFrom
          ? "AMC renewed with a new contract"
          : "AMC contract created" + (autoSchedule ? " with scheduled services" : "")
      );

      // If a bill was generated, offer to open it so the owner can share the
      // PDF / WhatsApp it. Otherwise just return to the list.
      const billId = result?.bill?.id;
      if (billId) {
        confirm({
          title: "Bill generated",
          message: `Bill ${result.bill.bill_number || ""} was created for this AMC. Open it to share the PDF?`,
          confirmText: "View & Share",
          cancelText: "Not now",
          onConfirm: () => navigation.replace("BillDetail", { id: billId }),
          onCancel: () => navigation.goBack(),
        });
      } else {
        navigation.goBack();
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
    >
      {/* Customer Selection */}
      {!preCustomerId && (
        <Card style={{ marginBottom: 16 }}>
          <Input
            label="Select Customer *"
            icon="account-search-outline"
            placeholder="Search customer by name or phone..."
            value={customerSearch}
            style={{ marginBottom: 0 }}
            onChangeText={(text) => {
              setCustomerSearch(text);
              // Editing clears any prior selection and reopens the dropdown.
              if (selectedCustomer) setSelectedCustomer(null);
              if (text.length > 2) {
                setShowDropdown(true);
                fetchCustomers(text);
              } else {
                setShowDropdown(false);
              }
            }}
          />
          {showDropdown && customerSearch.length > 2 && (
            <View
              style={[
                styles.dropdown,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
              ]}
            >
              {searching ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ padding: 12 }} />
              ) : customers.length === 0 ? (
                <Text style={[styles.dropdownEmpty, { color: colors.textSecondary }]}>
                  No customers found
                </Text>
              ) : (
                customers.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: colors.divider },
                      selectedCustomer === c.id && { backgroundColor: colors.primarySoft },
                    ]}
                    onPress={() => {
                      setSelectedCustomer(c.id);
                      setCustomerSearch(c.name);
                      setShowDropdown(false); // close after selecting
                    }}
                  >
                    <Text style={[styles.dropdownText, { color: colors.text }]}>
                      {c.name} - {c.phone}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </Card>
      )}

      {/* Plan Selection */}
      <Text style={[styles.label, { color: colors.text }]}>Select Plan *</Text>
      <View style={styles.planGrid}>
        {PLAN_PRESETS.map((preset) => {
          const active = selectedPlan === preset.name;
          return (
            <TouchableOpacity
              key={preset.name}
              style={[
                styles.planChip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => selectPlan(preset)}
            >
              <Text
                style={[
                  styles.planText,
                  { color: active ? colors.onPrimary : colors.textSecondary },
                  active && { fontWeight: "600" },
                ]}
              >
                {preset.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedPlan === "Custom" && (
        <Input
          label="Plan Name *"
          placeholder="e.g. Special 2-Year Plan"
          value={planName}
          error={errors.planName}
          onChangeText={(v) => {
            setPlanName(v.slice(0, 100));
            clearError("planName");
          }}
          onBlur={() => handleBlur("planName", planName)}
        />
      )}

      {/* Dates */}
      <DatePickerField
        label="Start Date *"
        value={startDate}
        onChange={handleStartDateChange}
        placeholder="Select start date"
      />

      <DatePickerField
        label="End Date *"
        value={endDate}
        onChange={(v) => {
          setEndDate(v);
          clearError("endDate");
        }}
        placeholder="Select end date"
        minDate={startDate ? new Date(startDate) : undefined}
      />
      {errors.endDate ? (
        <Text style={{ color: colors.danger, fontSize: 12, marginTop: -8, marginBottom: 8 }}>
          {errors.endDate}
        </Text>
      ) : null}

      {/* Services count */}
      <Input
        label="Total Services Included"
        value={totalServices}
        error={errors.totalServices}
        onChangeText={(v) => {
          setTotalServices(v.replace(/[^0-9]/g, ""));
          clearError("totalServices");
        }}
        onBlur={() => handleBlur("totalServices", totalServices)}
        keyboardType="numeric"
        placeholder="4"
      />

      {/* Amount */}
      <Input
        label="Contract Amount (₹)"
        icon="currency-inr"
        placeholder="0"
        value={amount}
        error={errors.amount}
        onChangeText={(v) => {
          setAmount(v.replace(/[^0-9.]/g, ""));
          clearError("amount");
        }}
        onBlur={() => handleBlur("amount", amount)}
        keyboardType="numeric"
      />

      {/* Payment status — a bill is auto-generated either way. */}
      <Text style={[styles.fieldLabel, { color: colors.text }]}>Payment</Text>
      <View style={styles.segmentRow}>
        {[
          { key: true, label: "Paid" },
          { key: false, label: "Unpaid" },
        ].map((opt) => {
          const active = isPaid === opt.key;
          return (
            <TouchableOpacity
              key={opt.label}
              activeOpacity={0.7}
              onPress={() => setIsPaid(opt.key)}
              style={[
                styles.segment,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  fontWeight: active ? "700" : "500",
                  color: active ? colors.onPrimary : colors.textSecondary,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Payment method — only when paid. */}
      {isPaid && (
        <View style={[styles.segmentRow, { marginTop: 8 }]}>
          {["cash", "upi", "online"].map((m) => {
            const active = paymentMethod === m;
            return (
              <TouchableOpacity
                key={m}
                activeOpacity={0.7}
                onPress={() => setPaymentMethod(m)}
                style={[
                  styles.segment,
                  {
                    backgroundColor: active ? colors.primarySoft : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontWeight: active ? "700" : "500",
                    color: active ? colors.primary : colors.textSecondary,
                    textTransform: "uppercase",
                    fontSize: 12,
                  }}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Auto-schedule toggle */}
      <View
        style={[
          styles.switchRow,
          { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md },
        ]}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>Auto-schedule services</Text>
          <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
            Evenly distributes {totalServices || 0} services across the contract period
          </Text>
        </View>
        <Switch
          value={autoSchedule}
          onValueChange={setAutoSchedule}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.surface}
        />
      </View>

      {/* Notes */}
      <Input
        label="Notes"
        placeholder="Any additional notes"
        value={notes}
        error={errors.notes}
        onChangeText={(v) => {
          setNotes(v.slice(0, 500));
          clearError("notes");
        }}
        onBlur={() => handleBlur("notes", notes)}
        multiline
      />

      <Button
        title={renewFrom ? "Renew AMC" : "Create AMC Contract"}
        icon={renewFrom ? "autorenew" : "file-document-plus-outline"}
        loading={loading}
        disabled={loading}
        onPress={handleSubmit}
        style={{ marginTop: 24 }}
      />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6, marginTop: 14 },
  dropdown: {
    borderWidth: 1,
    marginTop: 8,
    maxHeight: 180,
    overflow: "hidden",
  },
  dropdownItem: { padding: 14, borderBottomWidth: 1 },
  dropdownText: { fontSize: 14 },
  dropdownEmpty: { fontSize: 14, padding: 14, textAlign: "center" },
  planGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  planChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  planText: { fontSize: 13 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
  },
  switchLabel: { fontSize: 14, fontWeight: "500" },
  switchHint: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "500", marginBottom: 6, marginTop: 14 },
  segmentRow: { flexDirection: "row", gap: 8 },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { customerAPI, amcAPI } from "../../services/api";
import DatePickerField from "../../components/DatePickerField";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

const PLAN_PRESETS = [
  { name: "Annual Basic (4 services)", services: 4, months: 12 },
  { name: "Annual Premium (6 services)", services: 6, months: 12 },
  { name: "Half-Yearly (2 services)", services: 2, months: 6 },
  { name: "Custom", services: 0, months: 0 },
];

export default function CreateAMCScreen({ route, navigation }) {
  const preCustomerId = route.params?.customerId;
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(preCustomerId || null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planName, setPlanName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalServices, setTotalServices] = useState("4");
  const [amount, setAmount] = useState("");
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!preCustomerId) fetchCustomers();
  }, []);

  const fetchCustomers = async (search = "") => {
    setSearching(true);
    try {
      const params = search ? `search=${search}` : "";
      const result = await customerAPI.getAll(params);
      setCustomers(result.customers);
    } catch (error) {
      console.error(error.message);
    } finally {
      setSearching(false);
    }
  };

  const selectPlan = (preset) => {
    setSelectedPlan(preset.name);
    if (preset.name !== "Custom") {
      setPlanName(preset.name);
      setTotalServices(String(preset.services));
      if (startDate) {
        const start = new Date(startDate);
        start.setMonth(start.getMonth() + preset.months);
        setEndDate(formatDate(start));
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
    // Auto-calculate end date based on selected plan
    const preset = PLAN_PRESETS.find((p) => p.name === selectedPlan);
    if (preset && preset.months > 0) {
      const start = new Date(date);
      start.setMonth(start.getMonth() + preset.months);
      setEndDate(formatDate(start));
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      Alert.alert("Error", "Please select a customer");
      return;
    }
    if (!planName || !startDate || !endDate) {
      Alert.alert("Error", "Plan name, start date, and end date are required");
      return;
    }

    setLoading(true);
    try {
      await amcAPI.create({
        customer_id: selectedCustomer,
        plan_name: planName,
        start_date: startDate,
        end_date: endDate,
        total_services: parseInt(totalServices) || 4,
        amount: parseFloat(amount) || 0,
        auto_schedule: autoSchedule,
        notes,
      });
      Alert.alert("Success", "AMC contract created" + (autoSchedule ? " with scheduled services" : ""));
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Customer Selection */}
      {!preCustomerId && (
        <>
          <Text style={styles.label}>Select Customer *</Text>
          <TextInput
            style={styles.input}
            placeholder="Search customer by name or phone..."
            value={customerSearch}
            onChangeText={(text) => {
              setCustomerSearch(text);
              if (text.length > 2) fetchCustomers(text);
            }}
          />
          {customerSearch.length > 2 && (
            <View style={styles.dropdown}>
              {searching ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 12 }} />
              ) : customers.length === 0 ? (
                <Text style={styles.dropdownEmpty}>No customers found</Text>
              ) : (
                customers.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.dropdownItem,
                      selectedCustomer === c.id && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setSelectedCustomer(c.id);
                      setCustomerSearch(c.name);
                    }}
                  >
                    <Text style={styles.dropdownText}>{c.name} - {c.phone}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </>
      )}

      {/* Plan Selection */}
      <Text style={styles.label}>Select Plan *</Text>
      <View style={styles.planGrid}>
        {PLAN_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.name}
            style={[
              styles.planChip,
              selectedPlan === preset.name && styles.planChipActive,
            ]}
            onPress={() => selectPlan(preset)}
          >
            <Text
              style={[
                styles.planText,
                selectedPlan === preset.name && styles.planTextActive,
              ]}
            >
              {preset.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedPlan === "Custom" && (
        <>
          <Text style={styles.label}>Plan Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Special 2-Year Plan"
            value={planName}
            onChangeText={setPlanName}
          />
        </>
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
        onChange={setEndDate}
        placeholder="Select end date"
        minDate={startDate ? new Date(startDate) : undefined}
      />

      {/* Services count */}
      <Text style={styles.label}>Total Services Included</Text>
      <TextInput
        style={styles.input}
        value={totalServices}
        onChangeText={setTotalServices}
        keyboardType="numeric"
        placeholder="4"
      />

      {/* Amount */}
      <Text style={styles.label}>Contract Amount (Rs)</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      {/* Auto-schedule toggle */}
      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchLabel}>Auto-schedule services</Text>
          <Text style={styles.switchHint}>
            Evenly distributes {totalServices || 0} services across the contract period
          </Text>
        </View>
        <Switch
          value={autoSchedule}
          onValueChange={setAutoSchedule}
          trackColor={{ true: COLORS.primary }}
        />
      </View>

      {/* Notes */}
      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, { height: 70, textAlignVertical: "top" }]}
        placeholder="Any additional notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Create AMC Contract</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, paddingBottom: 40 },
  label: { ...FONTS.medium, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: COLORS.white,
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    marginTop: 4,
    maxHeight: 150,
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  dropdownItemActive: { backgroundColor: COLORS.primaryLight },
  dropdownText: { ...FONTS.regular },
  dropdownEmpty: { ...FONTS.regular, color: COLORS.gray, padding: 12, textAlign: "center" },
  planGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  planChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  planChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  planText: { ...FONTS.small },
  planTextActive: { color: COLORS.white, fontWeight: "600" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  switchLabel: { ...FONTS.medium },
  switchHint: { ...FONTS.small, color: COLORS.gray, marginTop: 2 },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 28,
  },
  buttonText: { color: COLORS.white, ...FONTS.bold },
});

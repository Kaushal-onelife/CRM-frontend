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
} from "react-native";
import { customerAPI, serviceAPI } from "../../services/api";
import { COLORS, FONTS, SIZES } from "../../constants/theme";
import DatePickerField from "../../components/DatePickerField";

const SERVICE_TYPES = [
  "installation",
  "amc",
  "repair",
  "filter_change",
  "general_service",
];

export default function AddServiceScreen({ navigation, route }) {
  const preselectedCustomerId = route.params?.customerId;
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(
    preselectedCustomerId || null
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!preselectedCustomerId) {
      fetchCustomers();
    }
  }, []);

  const fetchCustomers = async (search = "") => {
    try {
      const params = search ? `search=${search}` : "";
      const result = await customerAPI.getAll(params);
      setCustomers(result.customers);
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !serviceType || !scheduledDate) {
      Alert.alert("Error", "Customer, service type, and date are required");
      return;
    }

    setLoading(true);
    try {
      await serviceAPI.create({
        customer_id: selectedCustomer,
        service_type: serviceType,
        scheduled_date: scheduledDate,
        amount: amount ? parseFloat(amount) : 0,
        notes,
      });
      Alert.alert("Success", "Service scheduled successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Customer Selection */}
      {!preselectedCustomerId && (
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
              {customers.map((c) => (
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
                  <Text style={styles.dropdownText}>
                    {c.name} - {c.phone}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {/* Service Type */}
      <Text style={styles.label}>Service Type *</Text>
      <View style={styles.typeGrid}>
        {SERVICE_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeChip,
              serviceType === type && styles.typeChipActive,
            ]}
            onPress={() => setServiceType(type)}
          >
            <Text
              style={[
                styles.typeText,
                serviceType === type && styles.typeTextActive,
              ]}
            >
              {type.replace(/_/g, " ")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date */}
      <Text style={styles.label}>Scheduled Date *</Text>
      <DatePickerField
        value={scheduledDate}
        onChange={setScheduledDate}
        placeholder="Pick a date"
      />

      {/* Amount */}
      <Text style={styles.label}>Amount (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      {/* Notes */}
      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: "top" }]}
        placeholder="Any additional notes"
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
          <Text style={styles.buttonText}>Schedule Service</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  label: {
    ...FONTS.medium,
    marginBottom: 6,
    marginTop: 14,
  },
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
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  dropdownText: {
    ...FONTS.regular,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  typeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeText: {
    ...FONTS.small,
    textTransform: "capitalize",
  },
  typeTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 28,
  },
  buttonText: {
    color: COLORS.white,
    ...FONTS.bold,
  },
});

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
import { customerAPI, billAPI } from "../../services/api";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

export default function CreateBillScreen({ route, navigation }) {
  const preCustomerId = route.params?.customerId;
  const preServiceId = route.params?.serviceId;

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(preCustomerId || null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [items, setItems] = useState([
    { description: "", quantity: "1", unit_price: "" },
  ]);
  const [tax, setTax] = useState("0");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

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

  const updateItem = (index, key, value) => {
    const updated = [...items];
    updated[index][key] = value;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: "1", unit_price: "" }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const getSubtotal = () =>
    items.reduce(
      (sum, item) =>
        sum + (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0),
      0
    );

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      Alert.alert("Error", "Please select a customer");
      return;
    }

    const validItems = items.filter(
      (item) => item.description && item.unit_price
    );
    if (validItems.length === 0) {
      Alert.alert("Error", "Add at least one item");
      return;
    }

    setLoading(true);
    try {
      const billItems = validItems.map((item) => ({
        description: item.description,
        quantity: parseInt(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
      }));

      const result = await billAPI.create({
        customer_id: selectedCustomer,
        service_id: preServiceId || null,
        tax: parseFloat(tax) || 0,
        items: billItems,
      });

      Alert.alert("Success", `Bill ${result.bill_number} created`);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  const subtotal = getSubtotal();
  const total = subtotal + (parseFloat(tax) || 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Customer Selection */}
      {!preCustomerId && (
        <>
          <Text style={styles.label}>Select Customer *</Text>
          <TextInput
            style={styles.input}
            placeholder="Search customer..."
            value={customerSearch}
            onChangeText={(text) => {
              setCustomerSearch(text);
              if (text.length > 2) fetchCustomers(text);
            }}
          />
          {customerSearch.length > 2 && (
            <View style={styles.dropdown}>
              {searching ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary}
                  style={{ padding: 12 }}
                />
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
                    <Text>{c.name} - {c.phone}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </>
      )}

      {/* Line Items */}
      <Text style={[styles.label, { marginTop: 20 }]}>Bill Items</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemNumber}>Item {index + 1}</Text>
            {items.length > 1 && (
              <TouchableOpacity onPress={() => removeItem(index)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Description (e.g. RO Filter)"
            value={item.description}
            onChangeText={(v) => updateItem(index, "description", v)}
          />
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Qty</Text>
              <TextInput
                style={styles.input}
                value={item.quantity}
                onChangeText={(v) => updateItem(index, "quantity", v)}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.miniLabel}>Unit Price (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={item.unit_price}
                onChangeText={(v) => updateItem(index, "unit_price", v)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
        <Text style={styles.addItemText}>+ Add Item</Text>
      </TouchableOpacity>

      {/* Tax */}
      <Text style={styles.label}>Tax (₹)</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        value={tax}
        onChangeText={setTax}
        keyboardType="numeric"
      />

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>
            ₹{(parseFloat(tax) || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>₹{total.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Generate Bill</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, paddingBottom: 40 },
  label: { ...FONTS.medium, marginBottom: 6, marginTop: 14 },
  miniLabel: { ...FONTS.small, marginBottom: 4 },
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
  dropdownItemActive: { backgroundColor: COLORS.primaryLight },
  dropdownEmpty: {
    ...FONTS.regular,
    color: COLORS.gray,
    padding: 12,
    textAlign: "center",
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemNumber: { ...FONTS.medium, fontSize: 13 },
  removeText: { color: COLORS.danger, fontSize: 13 },
  itemRow: { flexDirection: "row", marginTop: 8 },
  addItemBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 4,
  },
  addItemText: { color: COLORS.primary, ...FONTS.medium },
  summary: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryLabel: { ...FONTS.regular, color: COLORS.gray },
  summaryValue: { ...FONTS.medium },
  divider: { height: 1, backgroundColor: COLORS.grayBorder, marginVertical: 8 },
  grandLabel: { ...FONTS.bold, fontSize: 16 },
  grandValue: { ...FONTS.bold, fontSize: 18, color: COLORS.primary },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: COLORS.white, ...FONTS.bold },
});

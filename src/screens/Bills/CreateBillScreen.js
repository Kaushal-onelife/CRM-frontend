import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { customerAPI, billAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import FormInput, { FormSection } from "../../components/FormInput";

export default function CreateBillScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
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
      Alert.alert("Required", "Please select a customer first.");
      return;
    }

    const validItems = items.filter(
      (item) => item.description && item.unit_price
    );
    if (validItems.length === 0) {
      Alert.alert("Missing Items", "Please add at least one item with a description and price.");
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

      Alert.alert("✓ Invoice Generated", `Bill ${result.bill_number} has been created.`, [
        { text: "View Invoices", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  const subtotal = getSubtotal();
  const taxValue = parseFloat(tax) || 0;
  const total = subtotal + taxValue;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 }}
      >
        <FormSection title="Client & Billing Info" icon="file-document-outline" colors={colors} />
        
        {!preCustomerId && (
          <View style={{ marginBottom: 16 }}>
            <FormInput
              label="Select Client"
              placeholder="Search by name or phone..."
              icon="account-search-outline"
              required={!selectedCustomer}
              value={customerSearch}
              onChangeText={(text) => {
                setCustomerSearch(text);
                if (text.length > 2) fetchCustomers(text);
              }}
            />
            {customerSearch.length > 2 && (
              <View 
                className="rounded-2xl border mb-2 overflow-hidden" 
                style={{ backgroundColor: colors.card, borderColor: isDark ? "#374151" : "#E2E8F0" }}
              >
                {searching ? (
                  <View className="p-4 items-center"><ActivityIndicator size="small" color={colors.primary} /></View>
                ) : customers.length === 0 ? (
                  <View className="p-4 items-center"><Text style={{ color: colors.textSecondary }}>No clients found</Text></View>
                ) : (
                  customers.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      className="flex-row items-center p-4 border-b"
                      style={{ 
                        backgroundColor: selectedCustomer === c.id ? `${colors.primary}10` : 'transparent',
                        borderColor: isDark ? "#374151" : "#F1F5F9"
                      }}
                      onPress={() => {
                        setSelectedCustomer(c.id);
                        setCustomerSearch(c.name);
                      }}
                    >
                      <MaterialCommunityIcons 
                        name={selectedCustomer === c.id ? "check-circle" : "account-outline"} 
                        size={20} 
                        color={selectedCustomer === c.id ? colors.primary : colors.textSecondary} 
                        style={{ marginRight: 12 }}
                      />
                      <View>
                        <Text className="font-bold" style={{ color: colors.text }}>{c.name}</Text>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>{c.phone}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        <Text className="text-[12px] font-black uppercase tracking-widest mb-3" style={{ color: colors.textSecondary }}>
            Billing Items <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>

        {items.map((item, index) => (
          <View 
            key={index} 
            className="p-4 mb-4 rounded-3xl border"
            style={{ backgroundColor: colors.card, borderColor: isDark ? "#374151" : "#F1F5F9" }}
          >
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs font-black uppercase" style={{ color: colors.primary }}>Item #{index + 1}</Text>
                {items.length > 1 && (
                    <TouchableOpacity onPress={() => removeItem(index)}>
                        <MaterialCommunityIcons name="close-circle-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>
            
            <FormInput
              label="Description"
              placeholder="e.g. RO Filter, Membrane Service"
              value={item.description}
              onChangeText={(v) => updateItem(index, "description", v)}
            />
            
            <View className="flex-row" style={{ gap: 15 }}>
                <View className="flex-1">
                    <FormInput
                        label="Quantity"
                        placeholder="1"
                        value={item.quantity}
                        onChangeText={(v) => updateItem(index, "quantity", v)}
                        keyboardType="numeric"
                    />
                </View>
                <View className="flex-1">
                    <FormInput
                        label="Unit Price (₹)"
                        placeholder="0.00"
                        value={item.unit_price}
                        onChangeText={(v) => updateItem(index, "unit_price", v)}
                        keyboardType="numeric"
                    />
                </View>
            </View>
          </View>
        ))}

        <TouchableOpacity 
            className="flex-row items-center justify-center p-4 mb-6 rounded-2xl border-dashed border-2"
            style={{ borderColor: colors.primary, backgroundColor: `${colors.primary}05` }}
            onPress={addItem}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text className="font-bold" style={{ color: colors.primary }}>Add Another Item</Text>
        </TouchableOpacity>

        <FormSection title="Financial Summary" icon="calculator" colors={colors} />
        
        <FormInput
          label="Additional Tax (₹)"
          placeholder="0.00"
          icon="percent-outline"
          value={tax}
          onChangeText={setTax}
          keyboardType="numeric"
        />

        <View 
            className="p-6 rounded-3xl mb-6 shadow-sm border"
            style={{ backgroundColor: isDark ? "#1E1E2E" : "#F8FAFC", borderColor: isDark ? "#374151" : "#F1F5F9" }}
        >
            <View className="flex-row justify-between mb-2">
                <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
                <Text className="font-bold" style={{ color: colors.text }}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-4">
                <Text style={{ color: colors.textSecondary }}>Tax</Text>
                <Text className="font-bold" style={{ color: colors.text }}>₹{taxValue.toFixed(2)}</Text>
            </View>
            <View className="h-[1px] mb-4" style={{ backgroundColor: isDark ? "#374151" : "#E2E8F0" }} />
            <View className="flex-row justify-between items-center">
                <Text className="text-lg font-black" style={{ color: colors.text }}>Grand Total</Text>
                <Text className="text-2xl font-black" style={{ color: colors.primary }}>₹{total.toFixed(2)}</Text>
            </View>
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center p-4 rounded-2xl shadow-lg"
          style={{ 
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
            opacity: loading ? 0.7 : 1
          }}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="receipt" size={24} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text className="text-white font-black text-base">Generate Final Invoice</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

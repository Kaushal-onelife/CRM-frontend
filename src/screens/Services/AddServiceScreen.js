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
import { customerAPI, serviceAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import FormInput, { FormSection } from "../../components/FormInput";

const SERVICE_TYPES = [
  { id: "installation", label: "Installation", icon: "plus-circle-outline" },
  { id: "amc", label: "AMC Service", icon: "shield-check-outline" },
  { id: "repair", label: "Repair", icon: "wrench-outline" },
  { id: "filter_change", label: "Filter Change", icon: "water-outline" },
  { id: "general_service", label: "General Service", icon: "cog-outline" },
];

export default function AddServiceScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const preselectedCustomerId = route.params?.customerId;
  
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(preselectedCustomerId || null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

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
      setCustomers(result.customers);
    } catch (error) {
      console.error(error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !serviceType || !scheduledDate) {
      Alert.alert("Required Fields", "Please select a customer, service type, and set a date.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
      Alert.alert("Invalid Date", "Please use YYYY-MM-DD format (e.g., 2026-04-15)");
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
      Alert.alert("✓ Scheduled", "Service has been scheduled successfully.", [
        { text: "View Tasks", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 60 }}
      >
        <FormSection title="Service Context" icon="calendar-check" colors={colors} />
        
        {!preselectedCustomerId && (
          <View style={{ marginBottom: 16 }}>
            <FormInput
              label="Find Customer"
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
                  <View className="p-4 items-center"><Text style={{ color: colors.textSecondary }}>No customers found</Text></View>
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
            Service Type <Text style={{ color: '#EF4444' }}>*</Text>
        </Text>
        <View className="flex-row flex-wrap mb-6" style={{ gap: 10 }}>
          {SERVICE_TYPES.map((type) => {
            const isActive = serviceType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                className="flex-row items-center px-4 py-3 rounded-2xl border"
                style={{
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderColor: isActive ? colors.primary : isDark ? "#374151" : "#E2E8F0",
                }}
                onPress={() => setServiceType(type.id)}
              >
                <MaterialCommunityIcons 
                    name={type.icon} 
                    size={18} 
                    color={isActive ? "#FFFFFF" : colors.textSecondary} 
                    style={{ marginRight: 8 }}
                />
                <Text
                  className="text-xs font-bold"
                  style={{ color: isActive ? "#FFFFFF" : colors.text }}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FormSection title="Scheduling & Financials" icon="cash-clock" colors={colors} />
        
        <FormInput
          label="Scheduled Date"
          placeholder="YYYY-MM-DD"
          icon="calendar-month-outline"
          required
          value={scheduledDate}
          onChangeText={setScheduledDate}
        />

        <FormInput
          label="Estimated Amount"
          placeholder="0.00"
          icon="currency-inr"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <FormInput
          label="Job Notes"
          placeholder="Add any specific instructions for the technician…"
          icon="clipboard-text-outline"
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity
          className="flex-row items-center justify-center p-4 mt-6 rounded-2xl"
          style={{ 
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
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
              <MaterialCommunityIcons name="calendar-plus" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text className="text-white font-black tracking-tight text-base">Schedule Service Task</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

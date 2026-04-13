import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { customerAPI, serviceAPI } from "../../services/api";
import ServiceCard from "../../components/ServiceCard";
import { useTheme } from "../../context/ThemeContext";

export default function CustomerDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors, isDark } = useTheme();
  const [customer, setCustomer] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [cust, svc] = await Promise.all([
        customerAPI.getById(id),
        serviceAPI.getAll(`customer_id=${id}`),
      ]);
      setCustomer(cust);
      setServices(svc.services);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id])
  );

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (customer?.phone) {
      const phone = customer.phone.replace(/\D/g, "");
      const number = phone.startsWith("91") ? phone : `91${phone}`;
      Linking.openURL(`whatsapp://send?phone=${number}`);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${customer.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await customerAPI.delete(id);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!customer) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <MaterialCommunityIcons name="account-off-outline" size={60} color={colors.textSecondary} />
        <Text className="mt-4 text-lg font-bold" style={{ color: colors.text }}>Customer not found</Text>
      </View>
    );
  }

  const ActionBtn = ({ label, icon, onPress, color = colors.primary }) => (
    <TouchableOpacity 
        className="items-center" 
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View 
            className="w-14 h-14 rounded-2xl items-center justify-center mb-2 shadow-sm"
            style={{ backgroundColor: isDark ? "#121212" : "#F1F5F9" }}
        >
            <MaterialCommunityIcons name={icon} size={26} color={color} />
        </View>
        <Text className="text-[10px] uppercase font-black tracking-widest" style={{ color: colors.textSecondary }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView 
        className="flex-1" 
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
    >
      {/* Premium Header */}
      <View 
        className="items-center py-10 px-6 border-b" 
        style={{ backgroundColor: colors.card, borderColor: isDark ? "#374151" : "#F1F5F9" }}
      >
        <View 
            className="w-24 h-24 rounded-full items-center justify-center mb-4 border-4"
            style={{ backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}20` }}
        >
          <Text className="text-4xl font-black" style={{ color: colors.primary }}>
            {customer.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="text-2xl font-black tracking-tight" style={{ color: colors.text }}>{customer.name}</Text>
        <Text className="text-sm font-bold mt-1" style={{ color: colors.textSecondary }}>{customer.phone}</Text>

        <View className="flex-row mt-8" style={{ gap: 20 }}>
          <ActionBtn label="Call" icon="phone" onPress={handleCall} />
          <ActionBtn label="Message" icon="whatsapp" onPress={handleWhatsApp} color="#25D366" />
          <ActionBtn 
            label="Schedule" 
            icon="calendar-plus" 
            onPress={() => navigation.navigate("AddService", { customerId: id })} 
            color="#8B5CF6"
          />
          <ActionBtn 
            label="Bill" 
            icon="receipt-text" 
            onPress={() => navigation.navigate("Bills", { screen: "CreateBill", params: { customerId: id } })} 
            color="#F59E0B"
          />
        </View>
      </View>

      <View className="p-6">
        {/* Device Information section */}
        <View className="flex-row items-center mb-4">
            <MaterialCommunityIcons name="water-pump" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <Text className="text-xs font-black uppercase tracking-widest" style={{ color: colors.textSecondary }}>Asset Details</Text>
        </View>
        
        <View 
            className="p-5 rounded-3xl border mb-8 shadow-sm"
            style={{ backgroundColor: colors.card, borderColor: isDark ? "#374151" : "#F3F4F6" }}
        >
            <View className="flex-row mb-4">
                <View className="flex-1">
                    <Text className="text-[10px] uppercase font-black tracking-tighter" style={{ color: colors.textSecondary }}>Brand</Text>
                    <Text className="text-base font-bold" style={{ color: colors.text }}>{customer.purifier_brand || "Not specified"}</Text>
                </View>
                <View className="flex-1">
                    <Text className="text-[10px] uppercase font-black tracking-tighter" style={{ color: colors.textSecondary }}>Model</Text>
                    <Text className="text-base font-bold" style={{ color: colors.text }}>{customer.purifier_model || "Not specified"}</Text>
                </View>
            </View>
            
            <View className="flex-1 mb-4">
                <Text className="text-[10px] uppercase font-black tracking-tighter" style={{ color: colors.textSecondary }}>Service Address</Text>
                <Text className="text-sm font-medium leading-5" style={{ color: colors.text }}>{customer.address || "No address provided"}{customer.city ? `, ${customer.city}` : ""}</Text>
            </View>

            {customer.notes && (
                <View className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                     <Text className="text-[9px] uppercase font-black tracking-tighter mb-1" style={{ color: colors.textSecondary }}>Internal Notes</Text>
                     <Text className="text-xs text-slate-600 dark:text-slate-400 font-medium italic">"{customer.notes}"</Text>
                </View>
            )}
        </View>

        {/* Service History */}
        <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
                <MaterialCommunityIcons name="history" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                <Text className="text-xs font-black uppercase tracking-widest" style={{ color: colors.textSecondary }}>Job History ({services.length})</Text>
            </View>
        </View>

        {services.length === 0 ? (
          <View className="items-center py-10 rounded-3xl bg-slate-50 dark:bg-slate-800/30">
            <Text style={{ color: colors.textSecondary }}>No services recorded yet</Text>
          </View>
        ) : (
          services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onPress={() =>
                navigation.navigate("Services", {
                  screen: "ServiceDetail",
                  params: { id: service.id },
                })
              }
            />
          ))
        )}

        {/* Danger Zone */}
        <View className="mt-10 pt-6 border-t" style={{ borderColor: isDark ? "#374151" : "#F1F5F9" }}>
            <View className="flex-row" style={{ gap: 12 }}>
                <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center p-4 rounded-2xl"
                    style={{ backgroundColor: `${colors.primary}10` }}
                    onPress={() => navigation.navigate("EditCustomer", { id, customer })}
                >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text className="font-bold" style={{ color: colors.primary }}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    className="flex-row items-center justify-center p-4 px-6 rounded-2xl"
                    style={{ backgroundColor: `${colors.danger}10` }}
                    onPress={handleDelete}
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
            </View>
        </View>
      </View>

      <View className="h-20" />
    </ScrollView>
  );
}

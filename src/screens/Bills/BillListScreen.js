import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { billAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const FILTERS = ["all", "unpaid", "paid"];

export default function BillListScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [bills, setBills] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchBills = async (filter = "all") => {
    try {
      const params = filter !== "all" ? `payment_status=${filter}` : "";
      const result = await billAPI.getAll(params);
      setBills(result.bills);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBills(activeFilter);
    }, [activeFilter])
  );

  const renderBill = ({ item }) => {
    const isPaid = item.payment_status === "paid";
    return (
      <TouchableOpacity
        className="mb-4 rounded-3xl border overflow-hidden shadow-sm"
        style={{
          backgroundColor: colors.card,
          borderColor: isDark ? "#374151" : "#F3F4F6",
        }}
        onPress={() => navigation.navigate("BillDetail", { id: item.id })}
        activeOpacity={0.7}
      >
        <View className="flex-row p-5 items-center">
            <View 
                className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: isPaid ? "#10B98115" : "#EF444415" }}
            >
                <MaterialCommunityIcons 
                    name={isPaid ? "check-decagram-outline" : "file-clock-outline"} 
                    size={26} 
                    color={isPaid ? "#10B981" : "#EF4444"} 
                />
            </View>
            
            <View className="flex-1">
                <View className="flex-row justify-between items-start">
                    <View>
                        <Text className="text-xs font-black tracking-widest uppercase mb-1" style={{ color: colors.textSecondary }}>
                            {item.bill_number}
                        </Text>
                        <Text className="text-base font-black tracking-tight" style={{ color: colors.text }} numberOfLines={1}>
                            {item.customers?.name || "Anonymous"}
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-lg font-black tracking-tighter" style={{ color: colors.text }}>
                            ₹{item.total}
                        </Text>
                        <View 
                            className="px-2 py-0.5 rounded-full mt-1 border"
                            style={{ 
                                backgroundColor: isPaid ? "#10B98110" : "#EF444410",
                                borderColor: isPaid ? "#10B98130" : "#EF444430"
                            }}
                        >
                            <Text className="text-[9px] font-black uppercase tracking-widest" style={{ color: isPaid ? "#10B981" : "#EF4444" }}>
                                {item.payment_status}
                            </Text>
                        </View>
                    </View>
                </View>
                
                <View className="flex-row items-center mt-3 pt-3 border-t" style={{ borderColor: isDark ? "#374151" : "#F1F5F9" }}>
                    <MaterialCommunityIcons name="calendar-range" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text className="text-[11px] font-bold" style={{ color: colors.textSecondary }}>
                        Issued: {new Date(item.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </Text>
                    
                    <View className="flex-1 items-end">
                         <View className="flex-row items-center">
                            <Text className="text-[10px] font-bold mr-1" style={{ color: colors.primary }}>View Details</Text>
                            <MaterialCommunityIcons name="arrow-right" size={10} color={colors.primary} />
                         </View>
                    </View>
                </View>
            </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View className="mb-4 mt-2 px-1">
      <Text
        className="text-3xl font-black tracking-tight"
        style={{ color: colors.text }}
      >
        Invoices
      </Text>
      <Text
        className="text-sm font-semibold mt-1"
        style={{ color: colors.textSecondary }}
      >
        Revenue tracking and billing history
      </Text>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="pt-2 px-4 pb-2">
        <ListHeader />
        <View className="mt-2 mb-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  className="px-5 py-2.5 rounded-full mr-3 border"
                  style={{
                    backgroundColor: isActive ? "#2563EB" : colors.card,
                    borderColor: isActive ? "#2563EB" : isDark ? "#374151" : "#E5E7EB",
                  }}
                  onPress={() => {
                    setActiveFilter(filter);
                    setLoading(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-xs font-black capitalize tracking-widest"
                    style={{ color: isActive ? "#FFFFFF" : colors.textSecondary }}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => item.id}
          renderItem={renderBill}
          ListEmptyComponent={
            <View className="items-center justify-center pt-20">
               <View 
                  className="w-24 h-24 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <MaterialCommunityIcons name="receipt" size={40} color="#2563EB" />
                </View>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>No invoices found</Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>Sync with cloud to refresh</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

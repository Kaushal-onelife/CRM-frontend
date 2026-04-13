import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { customerAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

export default function CustomerListScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async (searchText = "") => {
    try {
      const params = searchText ? `search=${searchText}` : "";
      const result = await customerAPI.getAll(params);
      setCustomers(result.customers);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [])
  );

  const handleSearch = (text) => {
    setSearch(text);
    if (text.length > 2 || text.length === 0) {
      fetchCustomers(text);
    }
  };

  const renderCustomer = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 mb-3 rounded-2xl border"
      style={{
        backgroundColor: colors.card,
        borderColor: isDark ? "#374151" : "#F3F4F6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
      onPress={() =>
        navigation.navigate("CustomerDetail", { id: item.id, name: item.name })
      }
      activeOpacity={0.7}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: `${colors.primary}20` }}
      >
        <Text
          className="text-lg font-black"
          style={{ color: "#2563EB" }}
        >
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View className="flex-1">
        <Text
          className="text-base font-extrabold tracking-tight mb-0.5"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="phone-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
          <Text className="text-xs font-semibold mr-3" style={{ color: colors.textSecondary }}>
            {item.phone || "N/A"}
          </Text>
          
          {item.city && (
            <>
              <View className="w-1 h-1 rounded-full mr-3" style={{ backgroundColor: colors.textSecondary, opacity: 0.4 }} />
              <MaterialCommunityIcons name="map-marker-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }} numberOfLines={1}>
                {item.city}
              </Text>
            </>
          )}
        </View>
      </View>

      <View className="items-end justify-center ml-2">
        <View className="p-1.5 rounded-full" style={{ backgroundColor: isDark ? "#374151" : "#F3F4F6" }}>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View className="mb-6 mt-2 px-1">
      <Text
        className="text-3xl font-black tracking-tight"
        style={{ color: colors.text }}
      >
        Customers
      </Text>
      <Text
        className="text-sm font-semibold mt-1"
        style={{ color: colors.textSecondary }}
      >
        Manage your clients and their details
      </Text>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="pt-2 px-4 pb-2">
        <ListHeader />
        
        <View
          className="flex-row items-center px-4 h-12 rounded-xl border mb-2"
          style={{
            backgroundColor: colors.card,
            borderColor: isDark ? "#374151" : "#E5E7EB",
          }}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 text-sm font-medium"
            style={{ color: colors.text }}
            placeholder="Search by name or phone..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <MaterialCommunityIcons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomer}
          ListEmptyComponent={
            <View className="items-center justify-center pt-20">
               <View 
                  className="w-24 h-24 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <MaterialCommunityIcons name="account-search-outline" size={40} color="#2563EB" />
                </View>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>No customers found</Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>Try a different search query</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        className="absolute right-6 bottom-6 w-14 h-14 rounded-full items-center justify-center"
        style={{
          backgroundColor: "#2563EB",
          shadowColor: "#2563EB",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 6,
        }}
        onPress={() => navigation.navigate("AddCustomer")}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

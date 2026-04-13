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
import { serviceAPI } from "../../services/api";
import ServiceCard from "../../components/ServiceCard";
import { useTheme } from "../../context/ThemeContext";

const FILTERS = ["all", "upcoming", "pending", "completed", "rejected"];

export default function ServiceListScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [services, setServices] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchServices = async (filter = "all") => {
    try {
      const params = filter !== "all" ? `status=${filter}` : "";
      const result = await serviceAPI.getAll(params);
      setServices(result.services);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchServices(activeFilter);
    }, [activeFilter])
  );

  const ListHeader = () => (
    <View className="mb-4 mt-2 px-1">
      <Text
        className="text-3xl font-black tracking-tight"
        style={{ color: colors.text }}
      >
        Services
      </Text>
      <Text
        className="text-sm font-semibold mt-1"
        style={{ color: colors.textSecondary }}
      >
        Manage maintenance and repair jobs
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
                  className="px-4 py-2.5 rounded-full mr-3 border"
                  style={{
                    backgroundColor: isActive ? "#2563EB" : colors.card,
                    borderColor: isActive ? "#2563EB" : isDark ? "#374151" : "#E5E7EB",
                    shadowColor: isActive ? "#2563EB" : "#000",
                    shadowOffset: { width: 0, height: isActive ? 2 : 1 },
                    shadowOpacity: isActive ? 0.3 : 0.05,
                    shadowRadius: isActive ? 4 : 2,
                    elevation: isActive ? 3 : 1,
                  }}
                  onPress={() => {
                    setActiveFilter(filter);
                    setLoading(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-sm font-bold capitalize tracking-wide"
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
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              onPress={() =>
                navigation.navigate("ServiceDetail", { id: item.id })
              }
            />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center pt-20">
              <View 
                className="w-24 h-24 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <MaterialCommunityIcons name="clipboard-text-outline" size={40} color="#2563EB" />
              </View>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>No services found</Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>Try clearing filters</Text>
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
        onPress={() => navigation.navigate("AddService")}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

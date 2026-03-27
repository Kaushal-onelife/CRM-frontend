import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { serviceAPI } from "../../services/api";
import ServiceCard from "../../components/ServiceCard";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

const FILTERS = ["all", "upcoming", "pending", "completed", "rejected"];

export default function ServiceListScreen({ navigation }) {
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

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filters}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => {
              setActiveFilter(filter);
              setLoading(true);
            }}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 40 }}
        />
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
            <Text style={styles.emptyText}>No services found</Text>
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddService")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  filters: {
    flexDirection: "row",
    marginBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    ...FONTS.small,
    textTransform: "capitalize",
  },
  filterTextActive: {
    color: COLORS.white,
    fontWeight: "600",
  },
  emptyText: {
    ...FONTS.regular,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 40,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  fabText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },
});

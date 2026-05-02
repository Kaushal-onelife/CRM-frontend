import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { serviceAPI } from "../../services/api";
import ServiceCard from "../../components/ServiceCard";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

const FILTERS = [
  "all",
  "upcoming",
  "due",
  "pending",
  "followup",
  "completed",
  "rejected",
];

const FILTER_COLORS = {
  all: COLORS.primary,
  upcoming: "#2563EB",
  due: "#F97316",
  pending: "#F59E0B",
  followup: "#8B5CF6",
  completed: "#10B981",
  rejected: "#EF4444",
};

const FILTER_LABELS = {
  all: "All",
  upcoming: "Upcoming",
  due: "Due",
  pending: "Pending",
  followup: "Follow Up",
  completed: "Completed",
  rejected: "Rejected",
};

export default function ServiceListScreen({ navigation }) {
  const [services, setServices] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchServices = async (filter = "all", pageNum = 1, append = false) => {
    if (append) setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 20 });
      if (filter !== "all") params.set("status", filter);
      const result = await serviceAPI.getAll(params.toString());
      const newData = result.services || [];
      setServices(append ? (prev) => [...prev, ...newData] : newData);
      setPage(pageNum);
      setHasMore(newData.length >= 20);
    } catch (error) {
      Alert.alert("Error", "Failed to load services");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchServices(activeFilter, 1);
    }, [activeFilter])
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchServices(activeFilter, page + 1, true);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          const filterColor = FILTER_COLORS[filter] || COLORS.primary;
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                isActive && {
                  backgroundColor: filterColor,
                  borderColor: filterColor,
                },
              ]}
              onPress={() => {
                setActiveFilter(filter);
                setLoading(true);
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive && styles.filterTextActive,
                ]}
              >
                {FILTER_LABELS[filter] || filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchServices(activeFilter, 1);
              }}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
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
  filtersScroll: {
    maxHeight: 44,
    marginBottom: 12,
  },
  filters: {
    flexDirection: "row",
    paddingRight: 16,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  filterText: {
    ...FONTS.small,
    fontSize: 13,
    fontWeight: "500",
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

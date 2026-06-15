import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { serviceAPI } from "../../services/api";
import ServiceCard from "../../components/ServiceCard";
import { EmptyState, SkeletonList } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

const FILTERS = [
  "all",
  "upcoming",
  "due",
  "pending",
  "followup",
  "completed",
  "rejected",
];

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
  const { colors, spacing, radius, elevation } = useTheme();
  const [services, setServices] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const filterColor = (filter) => {
    switch (filter) {
      case "upcoming":
        return colors.primary;
      case "due":
        return "#F97316";
      case "pending":
        return colors.warning;
      case "followup":
        return colors.accent;
      case "completed":
        return colors.success;
      case "rejected":
        return colors.danger;
      default:
        return colors.primary;
    }
  };

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

  const handleServicePress = useCallback(
    (service) => navigation.navigate("ServiceDetail", { id: service.id }),
    [navigation]
  );

  const renderServiceItem = useCallback(
    ({ item, index }) => (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}>
        <ServiceCard service={item} onPress={handleServicePress} />
      </Animated.View>
    ),
    [handleServicePress]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 48, marginTop: spacing.md, marginBottom: spacing.md }}
        contentContainerStyle={{ flexDirection: "row", paddingRight: spacing.lg, alignItems: "center" }}
      >
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          const fColor = filterColor(filter);
          return (
            <TouchableOpacity
              key={filter}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: radius.full,
                marginRight: spacing.sm,
                borderWidth: 1,
                backgroundColor: isActive ? fColor : colors.card,
                borderColor: isActive ? fColor : colors.border,
              }}
              onPress={() => {
                setActiveFilter(filter);
                setLoading(true);
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? "600" : "500",
                  color: isActive ? colors.onPrimary : colors.textSecondary,
                }}
              >
                {FILTER_LABELS[filter] || filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <SkeletonList count={6} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={keyExtractor}
          renderItem={renderServiceItem}
          ListEmptyComponent={
            <EmptyState
              icon="clipboard-text-outline"
              title="No services found"
              message={
                activeFilter === "all"
                  ? "Schedule your first service to get started."
                  : `No ${FILTER_LABELS[activeFilter]?.toLowerCase() || activeFilter} services right now.`
              }
              actionLabel="Add Service"
              onAction={() => navigation.navigate("AddService")}
            />
          }
          contentContainerStyle={{ paddingBottom: 96, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={() => {
                setRefreshing(true);
                fetchServices(activeFilter, 1);
              }}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: spacing.lg }}
              />
            ) : null
          }
        />
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          {
            position: "absolute",
            right: spacing.xl,
            bottom: spacing.xl,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
          },
          elevation("lg"),
        ]}
        onPress={() => navigation.navigate("AddService")}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

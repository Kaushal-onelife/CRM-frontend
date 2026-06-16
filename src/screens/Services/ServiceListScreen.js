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
import { useQuery } from "@tanstack/react-query";
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
  const [activeFilter, setActiveFilter] = useState("all");
  // Pages beyond the first are appended here; the first page comes from useQuery.
  const [extraServices, setExtraServices] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildParams = (filter, pageNum) => {
    const params = new URLSearchParams({ page: pageNum, limit: 20 });
    if (filter !== "all") params.set("status", filter);
    return params.toString();
  };

  // Cache-first first page; reset pagination whenever the filter changes.
  const {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["services", activeFilter],
    queryFn: () => serviceAPI.getAll(buildParams(activeFilter, 1)),
  });

  const firstPage = data?.services || [];
  const services = [...firstPage, ...extraServices];
  // No more pages once the first page came back short, or a later page did.
  const canLoadMore = firstPage.length >= 20 && hasMore;

  const handleLoadMore = async () => {
    if (loadingMore || !canLoadMore || isLoading) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await serviceAPI.getAll(buildParams(activeFilter, nextPage));
      const newData = result.services || [];
      setExtraServices((prev) => [...prev, ...newData]);
      setPage(nextPage);
      setHasMore(newData.length >= 20);
    } catch (err) {
      Alert.alert("Error", "Failed to load services");
    } finally {
      setLoadingMore(false);
    }
  };

  // Drop any appended pages so we show only the freshly-fetched first page.
  const resetPagination = () => {
    setExtraServices([]);
    setPage(1);
    setHasMore(true);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    resetPagination();
  };

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
              onPress={() => handleFilterChange(filter)}
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

      {isLoading && !data ? (
        <SkeletonList count={6} />
      ) : error && !data ? (
        <EmptyState
          tone="error"
          icon="cloud-off-outline"
          title="Couldn't load services"
          message={error.message || "Failed to load services"}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
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
              refreshing={isRefetching}
              tintColor={colors.primary}
              onRefresh={() => {
                resetPagination();
                refetch();
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

import React, { useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { billAPI } from "../../services/api";
import { Card, Badge, EmptyState, SkeletonList, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

const FILTERS = ["all", "unpaid", "paid"];

const formatMoney = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : "₹0";
};

// First day of the month AFTER the given "YYYY-MM" (exclusive upper bound).
const nextMonthStart = (monthKey) => {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1)); // m is already next month (0-indexed)
  return d.toISOString().split("T")[0];
};

export default function BillListScreen({ navigation, route }) {
  const { colors, radius, elevation } = useTheme();
  const toast = useToast();
  const [activeFilter, setActiveFilter] = useState("all");
  // When arriving from the Revenue screen's month drill-down, scope to that month.
  const month = route?.params?.month || null;

  // Title reflects the month scope (e.g. "Bills · Jul 2026") when drilled in.
  useLayoutEffect(() => {
    if (route?.params?.title) {
      navigation.setOptions({ title: `Bills · ${route.params.title}` });
    }
  }, [navigation, route?.params?.title]);
  // Pages beyond the first are appended here; the first page comes from useQuery.
  const [extraBills, setExtraBills] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildParams = (filter, pageNum) => {
    const params = new URLSearchParams({ page: pageNum, limit: 20 });
    if (filter !== "all") params.set("payment_status", filter);
    if (month) {
      params.set("from", `${month}-01`);
      params.set("to", nextMonthStart(month));
    }
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
    queryKey: ["bills", activeFilter, month],
    queryFn: () => billAPI.getAll(buildParams(activeFilter, 1)),
  });

  const firstPage = data?.bills || [];
  const bills = [...firstPage, ...extraBills];
  // No more pages once the first page came back short, or a later page did.
  const canLoadMore = firstPage.length >= 20 && hasMore;

  const handleLoadMore = async () => {
    if (loadingMore || !canLoadMore || isLoading) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await billAPI.getAll(buildParams(activeFilter, nextPage));
      const newData = result.bills || [];
      setExtraBills((prev) => [...prev, ...newData]);
      setPage(nextPage);
      setHasMore(newData.length >= 20);
    } catch (error) {
      toast.error("Failed to load bills");
    } finally {
      setLoadingMore(false);
    }
  };

  // Drop any appended pages so we show only the freshly-fetched first page.
  const resetPagination = () => {
    setExtraBills([]);
    setPage(1);
    setHasMore(true);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    resetPagination();
  };

  const renderBill = ({ item, index }) => {
    const isPaid = item.payment_status === "paid";
    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}>
        <Card
          onPress={() => navigation.navigate("BillDetail", { id: item.id })}
          style={{ marginBottom: 12 }}
        >
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                {item.bill_number}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
                {item.customers?.name}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>
                {formatMoney(item.total)}
              </Text>
              <View style={{ marginTop: 6 }}>
                <Badge
                  label={isPaid ? "Paid" : "Unpaid"}
                  color={isPaid ? colors.success : colors.danger}
                  icon={isPaid ? "check-circle-outline" : "alert-circle-outline"}
                  size="sm"
                />
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={colors.textMuted}
              style={{ marginLeft: 4, alignSelf: "center" }}
            />
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.filters}>
        {FILTERS.map((filter) => {
          const active = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleFilterChange(filter)}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: active ? "600" : "500",
                  textTransform: "capitalize",
                  color: active ? colors.onPrimary : colors.textSecondary,
                }}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading && !data ? (
        <SkeletonList count={6} />
      ) : error && !data ? (
        <EmptyState
          tone="error"
          icon="cloud-off-outline"
          title="Couldn't load bills"
          message={error.message || "Failed to load bills"}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => item.id}
          renderItem={renderBill}
          ListEmptyComponent={
            <EmptyState
              icon="file-document-outline"
              title="No bills found"
              message={
                activeFilter === "all"
                  ? "Create your first bill to get started."
                  : `No ${activeFilter} bills right now.`
              }
              actionLabel="Create Bill"
              onAction={() => navigation.navigate("CreateBill")}
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
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
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
        />
      )}

      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.primary },
          elevation("lg"),
        ]}
        onPress={() => navigation.navigate("CreateBill")}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  filters: {
    flexDirection: "row",
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rightCol: {
    alignItems: "flex-end",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});

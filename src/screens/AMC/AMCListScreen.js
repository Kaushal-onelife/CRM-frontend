import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { amcAPI } from "../../services/api";
import { Card, Badge, EmptyState, SkeletonList, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

const FILTERS = ["all", "active", "expired"];

const formatMoney = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : `₹${n}`;
};

export default function AMCListScreen({ navigation }) {
  const { colors, elevation } = useTheme();
  const toast = useToast();
  const [activeFilter, setActiveFilter] = useState("all");

  // Helper to build the query params for a given filter + page.
  const buildParams = (filter, pageNum) => {
    const params = new URLSearchParams({ page: pageNum, limit: 20 });
    if (filter !== "all") params.set("status", filter);
    return params.toString();
  };

  // Cache-first primary fetch (page 1). Keyed per filter so each tab caches
  // independently and the persisted list shows instantly (incl. offline).
  const {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["amc", activeFilter],
    queryFn: () => amcAPI.getAll(buildParams(activeFilter, 1)),
  });

  const firstPage = data?.contracts || [];

  // Pagination kept as local "load more" state layered on top of the cached
  // first page. Reset whenever the cached first page changes (filter/refresh).
  const [extraContracts, setExtraContracts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  React.useEffect(() => {
    setExtraContracts([]);
    setPage(1);
    setHasMore(firstPage.length >= 20);
  }, [data, activeFilter]);

  const contracts = [...firstPage, ...extraContracts];

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await amcAPI.getAll(buildParams(activeFilter, nextPage));
      const newData = result.contracts || [];
      setExtraContracts((prev) => [...prev, ...newData]);
      setPage(nextPage);
      setHasMore(newData.length >= 20);
    } catch (e) {
      toast.error("Failed to load more AMC contracts");
    } finally {
      setLoadingMore(false);
    }
  };

  const getDaysRemaining = (endDate) => {
    const diff = new Date(endDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Resolve a Badge status + label for an AMC contract.
  const getStatusBadge = (item) => {
    const daysLeft = getDaysRemaining(item.end_date);
    const isExpiringSoon = item.status === "active" && daysLeft <= 30 && daysLeft > 0;
    // A renewed (superseded) contract gets its own badge so it isn't confused
    // with one that simply expired and was forgotten.
    if (item.is_renewed) {
      return { color: colors.primary, label: "Renewed", daysLeft, isExpiringSoon: false };
    }
    if (item.status === "active") {
      return isExpiringSoon
        ? { color: colors.warning, label: "Expiring soon", daysLeft, isExpiringSoon }
        : { color: colors.success, label: "Active", daysLeft, isExpiringSoon };
    }
    if (item.status === "expired") {
      return { color: colors.danger, label: "Expired", daysLeft, isExpiringSoon };
    }
    if (item.status === "cancelled") {
      return { color: colors.gray, label: "Cancelled", daysLeft, isExpiringSoon };
    }
    return { color: colors.success, label: "Active", daysLeft, isExpiringSoon };
  };

  const renderContract = ({ item }) => {
    const badge = getStatusBadge(item);

    return (
      <Card
        onPress={() => navigation.navigate("AMCDetail", { id: item.id })}
        padded={false}
        style={{ marginBottom: 12 }}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
                {item.customers?.name}
              </Text>
              <Text style={[styles.planName, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.plan_name}
              </Text>
            </View>
            <Badge color={badge.color} label={badge.label} size="sm" />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Period</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {item.start_date} → {item.end_date}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Services</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {item.services_used} / {item.total_services} used
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Amount</Text>
            <Text style={[styles.infoValue, { color: colors.text, fontWeight: "700" }]}>
              {formatMoney(item.amount)}
            </Text>
          </View>
        </View>

        {badge.isExpiringSoon && (
          <View style={[styles.warningBar, { backgroundColor: colors.warningSoft }]}>
            <MaterialCommunityIcons name="clock-alert-outline" size={14} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.warning }]}>
              Expiring in {badge.daysLeft} days · Renew soon
            </Text>
          </View>
        )}
      </Card>
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
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: active ? colors.onPrimary : colors.textSecondary },
                  active && { fontWeight: "600" },
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading && !data ? (
        <SkeletonList count={5} />
      ) : error && !data ? (
        <EmptyState
          tone="error"
          icon="cloud-off-outline"
          title="Couldn't load AMC contracts"
          message={error.message || "Failed to load AMC contracts"}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => item.id}
          renderItem={renderContract}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="file-document-outline"
              title="No AMC contracts found"
              message="Create a new annual maintenance contract to get started."
            />
          }
          contentContainerStyle={{ paddingBottom: 90 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              tintColor={colors.primary}
              onRefresh={() => refetch()}
            />
          }
          onEndReached={() => {
            if (!loadingMore && hasMore && !isLoading) {
              loadMore();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: 16 }} />
            ) : null
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, elevation("lg")]}
        onPress={() => navigation.navigate("CreateAMC")}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  filters: { flexDirection: "row", marginBottom: 16 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
  cardInner: { padding: 16 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  customerName: { fontSize: 16, fontWeight: "700" },
  planName: { fontSize: 13, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: "500" },
  warningBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
  },
  warningText: { fontSize: 12, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});

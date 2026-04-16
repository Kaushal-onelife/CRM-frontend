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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { amcAPI } from "../../services/api";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

const FILTERS = ["all", "active", "expired"];

const STATUS_CONFIG = {
  active: { color: COLORS.secondary, label: "Active" },
  expired: { color: COLORS.danger, label: "Expired" },
  cancelled: { color: COLORS.gray, label: "Cancelled" },
};

export default function AMCListScreen({ navigation }) {
  const [contracts, setContracts] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchContracts = async (filter = "all", pageNum = 1, append = false) => {
    if (append) setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 20 });
      if (filter !== "all") params.set("status", filter);
      const result = await amcAPI.getAll(params.toString());
      const newData = result.contracts;
      setContracts(append ? (prev) => [...prev, ...newData] : newData);
      setPage(pageNum);
      setHasMore(newData.length >= 20);
    } catch (error) {
      Alert.alert("Error", "Failed to load AMC contracts");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchContracts(activeFilter);
    }, [activeFilter])
  );

  const getDaysRemaining = (endDate) => {
    const diff = new Date(endDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const renderContract = ({ item }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.active;
    const daysLeft = getDaysRemaining(item.end_date);
    const isExpiringSoon = item.status === "active" && daysLeft <= 30 && daysLeft > 0;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("AMCDetail", { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{item.customers?.name}</Text>
            <Text style={styles.planName}>{item.plan_name}</Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: config.color + "20" },
            ]}
          >
            <Text style={[styles.badgeText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Period</Text>
            <Text style={styles.infoValue}>
              {item.start_date} to {item.end_date}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Services</Text>
            <Text style={styles.infoValue}>
              {item.services_used} / {item.total_services} used
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={styles.infoValue}>Rs {item.amount}</Text>
          </View>
        </View>

        {isExpiringSoon && (
          <View style={styles.warningBar}>
            <Text style={styles.warningText}>
              Expiring in {daysLeft} days - Renew soon!
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
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
              setPage(1);
              setHasMore(true);
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
          data={contracts}
          keyExtractor={(item) => item.id}
          renderItem={renderContract}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No AMC contracts found</Text>
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchContracts(activeFilter, 1);
              }}
            />
          }
          onEndReached={() => {
            if (!loadingMore && hasMore && !loading) {
              fetchContracts(activeFilter, page + 1, true);
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ paddingVertical: 16 }} />
            ) : null
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateAMC")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SIZES.padding },
  filters: { flexDirection: "row", marginBottom: 12 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { ...FONTS.small, textTransform: "capitalize" },
  filterTextActive: { color: COLORS.white, fontWeight: "600" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: 10,
    elevation: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: SIZES.padding,
    paddingBottom: 8,
  },
  customerName: { ...FONTS.bold, fontSize: 15 },
  planName: { ...FONTS.small, color: COLORS.gray, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  cardBody: { paddingHorizontal: SIZES.padding, paddingBottom: SIZES.padding },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  infoLabel: { ...FONTS.small, color: COLORS.gray },
  infoValue: { ...FONTS.small },
  warningBar: {
    backgroundColor: COLORS.warning + "15",
    padding: 8,
    alignItems: "center",
  },
  warningText: { ...FONTS.small, color: COLORS.warning, fontWeight: "600" },
  emptyText: { ...FONTS.regular, color: COLORS.gray, textAlign: "center", marginTop: 40 },
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
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: "300", marginTop: -2 },
});

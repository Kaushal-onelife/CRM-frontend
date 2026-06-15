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
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { billAPI } from "../../services/api";
import { Card, Badge, EmptyState, SkeletonList } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

const FILTERS = ["all", "unpaid", "paid"];

const formatMoney = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : "₹0";
};

export default function BillListScreen({ navigation }) {
  const { colors, radius, elevation } = useTheme();
  const [bills, setBills] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchBills = async (filter = "all", pageNum = 1, append = false) => {
    if (append) setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 20 });
      if (filter !== "all") params.set("payment_status", filter);
      const result = await billAPI.getAll(params.toString());
      const newData = result.bills || [];
      setBills(append ? (prev) => [...prev, ...newData] : newData);
      setPage(pageNum);
      setHasMore(newData.length >= 20);
    } catch (error) {
      Alert.alert("Error", "Failed to load bills");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchBills(activeFilter, page + 1, true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBills(activeFilter);
    }, [activeFilter])
  );

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
              onPress={() => {
                setActiveFilter(filter);
                setLoading(true);
                setPage(1);
                setHasMore(true);
              }}
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

      {loading ? (
        <SkeletonList count={6} />
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
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={() => {
                setRefreshing(true);
                fetchBills(activeFilter, 1);
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

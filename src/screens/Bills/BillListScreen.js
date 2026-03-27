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
import { billAPI } from "../../services/api";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

const FILTERS = ["all", "unpaid", "paid"];

export default function BillListScreen({ navigation }) {
  const [bills, setBills] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchBills = async (filter = "all") => {
    try {
      const params = filter !== "all" ? `payment_status=${filter}` : "";
      const result = await billAPI.getAll(params);
      setBills(result.bills);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBills(activeFilter);
    }, [activeFilter])
  );

  const renderBill = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("BillDetail", { id: item.id })}
    >
      <View style={styles.row}>
        <View>
          <Text style={styles.billNumber}>{item.bill_number}</Text>
          <Text style={styles.customer}>{item.customers?.name}</Text>
          <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.amount}>₹{item.total}</Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  item.payment_status === "paid"
                    ? COLORS.secondary + "20"
                    : COLORS.danger + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color:
                    item.payment_status === "paid"
                      ? COLORS.secondary
                      : COLORS.danger,
                },
              ]}
            >
              {item.payment_status}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
          data={bills}
          keyExtractor={(item) => item.id}
          renderItem={renderBill}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No bills found</Text>
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
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
    paddingHorizontal: 16,
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: 8,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  billNumber: {
    ...FONTS.bold,
  },
  customer: {
    ...FONTS.regular,
    color: COLORS.gray,
    marginTop: 2,
  },
  date: {
    ...FONTS.small,
    marginTop: 4,
  },
  rightCol: {
    alignItems: "flex-end",
  },
  amount: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  emptyText: {
    ...FONTS.regular,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 40,
  },
});

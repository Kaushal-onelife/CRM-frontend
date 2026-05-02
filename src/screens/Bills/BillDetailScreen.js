import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { billAPI } from "../../services/api";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

export default function BillDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const fetchBill = async () => {
    try {
      const data = await billAPI.getById(id);
      setBill(data);
      setError(null);
    } catch (err) {
      console.error(err.message);
      setError(err.message || "Failed to load bill");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBill();
    }, [id])
  );

  const handleMarkPaid = (method) => {
    Alert.alert("Mark as Paid", `Payment method: ${method}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            await billAPI.markPaid(id, { payment_method: method });
            fetchBill();
          } catch (error) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const handleShareBill = async () => {
    if (!bill) return;

    const itemLines = (bill.bill_items || [])
      .map(
        (item) =>
          `  ${item.description} x${item.quantity} = ₹${item.total}`
      )
      .join("\n");

    const message = `
--- INVOICE ---
Bill No: ${bill.bill_number}
Date: ${new Date(bill.created_at).toLocaleDateString()}

Customer: ${bill.customers?.name}
Phone: ${bill.customers?.phone}

Items:
${itemLines}

Subtotal: ₹${bill.amount}
Tax: ₹${bill.tax}
━━━━━━━━━━━━━━
Total: ₹${bill.total}

Payment: ${bill.payment_status.toUpperCase()}
${bill.payment_method ? `Method: ${bill.payment_method}` : ""}
---
    `.trim();

    try {
      await Share.share({ message });
    } catch (err) {
      console.error(err);
      Alert.alert("Couldn't share bill", err?.message || "Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>
          {error ? "Couldn't load bill" : "Bill not found"}
        </Text>
        {error ? <Text style={styles.errorMsg}>{error}</Text> : null}
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setLoading(true);
            fetchBill();
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPaid = bill.payment_status === "paid";

  return (
    <ScrollView style={styles.container}>
      {/* Bill Header */}
      <View style={styles.header}>
        <Text style={styles.billNumber}>{bill.bill_number}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: isPaid
                ? COLORS.secondary + "20"
                : COLORS.danger + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: isPaid ? COLORS.secondary : COLORS.danger },
            ]}
          >
            {bill.payment_status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.card}>
        <Text style={styles.label}>Customer</Text>
        <Text style={styles.customerName}>{bill.customers?.name}</Text>
        <Text style={styles.customerPhone}>{bill.customers?.phone}</Text>
        {bill.customers?.address && (
          <Text style={styles.customerAddress}>{bill.customers.address}</Text>
        )}
      </View>

      {/* Bill Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, { flex: 2 }]}>Description</Text>
          <Text style={styles.tableCell}>Qty</Text>
          <Text style={styles.tableCell}>Rate</Text>
          <Text style={[styles.tableCell, { textAlign: "right" }]}>Total</Text>
        </View>
        {(bill.bill_items || []).map((item, index) => (
          <View key={item.id || index} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {item.description}
            </Text>
            <Text style={styles.tableCell}>{item.quantity}</Text>
            <Text style={styles.tableCell}>₹{item.unit_price}</Text>
            <Text style={[styles.tableCell, { textAlign: "right" }]}>
              ₹{item.total}
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>₹{bill.amount}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax</Text>
          <Text style={styles.totalValue}>₹{bill.tax}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>₹{bill.total}</Text>
        </View>
      </View>

      {/* Payment Info */}
      {isPaid && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <Text style={styles.paidText}>
            Paid on {bill.paid_date} via {bill.payment_method}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareBill}>
          <Text style={styles.shareBtnText}>📤 Share Bill</Text>
        </TouchableOpacity>

        {!isPaid && (
          <View style={styles.payActions}>
            <Text style={styles.payTitle}>Mark as Paid:</Text>
            <View style={styles.payMethods}>
              {["cash", "upi", "card", "online"].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={styles.payMethodBtn}
                  onPress={() => handleMarkPaid(method)}
                >
                  <Text style={styles.payMethodText}>{method.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding * 1.5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  billNumber: { ...FONTS.h2 },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  card: {
    backgroundColor: COLORS.white,
    margin: SIZES.padding,
    marginBottom: 0,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    elevation: 1,
  },
  cardTitle: { ...FONTS.h3, marginBottom: 12 },
  label: { ...FONTS.small, marginBottom: 4 },
  customerName: { ...FONTS.bold, fontSize: 16 },
  customerPhone: { ...FONTS.regular, color: COLORS.gray, marginTop: 2 },
  customerAddress: { ...FONTS.small, marginTop: 4 },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  tableCell: { flex: 1, ...FONTS.regular, fontSize: 13 },
  divider: {
    height: 1,
    backgroundColor: COLORS.grayBorder,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: { ...FONTS.regular, color: COLORS.gray },
  totalValue: { ...FONTS.medium },
  grandTotalLabel: { ...FONTS.bold, fontSize: 16 },
  grandTotalValue: { ...FONTS.bold, fontSize: 18, color: COLORS.primary },
  paidText: { ...FONTS.regular, color: COLORS.secondary },
  actions: { padding: SIZES.padding },
  shareBtn: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  shareBtnText: { ...FONTS.bold },
  payActions: { marginTop: 16 },
  payTitle: { ...FONTS.medium, marginBottom: 10 },
  payMethods: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  payMethodBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  payMethodText: { color: COLORS.white, ...FONTS.bold, fontSize: 13 },
  errorTitle: { ...FONTS.h3, color: COLORS.danger, marginBottom: 6 },
  errorMsg: {
    ...FONTS.regular,
    color: COLORS.gray,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: { color: COLORS.white, ...FONTS.bold },
});

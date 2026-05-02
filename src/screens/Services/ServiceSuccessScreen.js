import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serviceAPI } from "../../services/api";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

const safeNum = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

export default function ServiceSuccessScreen({ route, navigation }) {
  const params = route.params || {};
  const {
    serviceId,
    customerName,
    customerPhone,
    paymentStatus,
    paymentMethod,
    nextDueDate,
  } = params;
  const serviceCharge = safeNum(params.serviceCharge);
  const partsTotal = safeNum(params.partsTotal);
  const totalAmount = safeNum(params.totalAmount);

  const [generatingBill, setGeneratingBill] = useState(false);
  const [billGenerated, setBillGenerated] = useState(false);
  const [billData, setBillData] = useState(null);

  const handleGenerateBill = async () => {
    setGeneratingBill(true);
    try {
      const result = await serviceAPI.generateBill({
        service_id: serviceId,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
      });
      setBillData(result);
      setBillGenerated(true);
      Alert.alert("Success", `Bill ${result.bill_number} created!`);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setGeneratingBill(false);
  };

  const handleSendBill = async () => {
    if (!billGenerated) {
      // Generate bill first, then send
      setGeneratingBill(true);
      try {
        const result = await serviceAPI.generateBill({
          service_id: serviceId,
          payment_status: paymentStatus,
          payment_method: paymentMethod,
        });
        setBillData(result);
        setBillGenerated(true);
        sendViaWhatsApp(result);
      } catch (error) {
        Alert.alert("Error", error.message);
      }
      setGeneratingBill(false);
    } else {
      sendViaWhatsApp(billData);
    }
  };

  const sendViaWhatsApp = (bill) => {
    const phone = customerPhone?.replace(/\D/g, "");
    const number = phone?.startsWith("91") ? phone : `91${phone}`;

    const partsText = bill.items
      ?.filter((item) => !item.description?.startsWith("Service Charge"))
      .map(
        (item) =>
          `  ${item.description} x${item.quantity} = ${safeNum(item.total).toFixed(2)}`
      )
      .join("\n") || "";

    const message = [
      `*Bill: ${bill.bill_number}*`,
      `Customer: ${customerName}`,
      ``,
      `Service Charge: ${serviceCharge.toFixed(2)}`,
      partsText ? `Parts:\n${partsText}` : "",
      `*Total: ${totalAmount.toFixed(2)}*`,
      `Payment: ${paymentStatus === "paid" ? `Paid (${paymentMethod})` : "Pending"}`,
      nextDueDate ? `\nNext Service Due: ${nextDueDate}` : "",
      `\nThank you!`,
    ]
      .filter(Boolean)
      .join("\n");

    Linking.openURL(
      `whatsapp://send?phone=${number}&text=${encodeURIComponent(message)}`
    );
  };

  const handleDone = () => {
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <View style={styles.successIcon}>
        <MaterialCommunityIcons name="check-circle" size={64} color={COLORS.secondary} />
      </View>
      <Text style={styles.successTitle}>Service Completed!</Text>

      {/* Summary Card */}
      <View style={styles.card}>
        <Text style={styles.customerName}>{customerName}</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service Charge</Text>
          <Text style={styles.summaryValue}>{serviceCharge.toFixed(2)}</Text>
        </View>
        {partsTotal > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Parts</Text>
            <Text style={styles.summaryValue}>{partsTotal.toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{totalAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name={paymentStatus === "paid" ? "check-circle" : "clock-outline"}
            size={16}
            color={paymentStatus === "paid" ? COLORS.secondary : COLORS.warning}
          />
          <Text style={styles.infoText}>
            {paymentStatus === "paid"
              ? `Paid via ${paymentMethod?.toUpperCase()}`
              : "Payment Pending"}
          </Text>
        </View>

        {nextDueDate && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.primary} />
            <Text style={styles.infoText}>Next Due: {nextDueDate}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {!billGenerated ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
            onPress={handleGenerateBill}
            disabled={generatingBill}
          >
            {generatingBill ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="receipt" size={20} color={COLORS.white} />
                <Text style={styles.actionBtnText}>Generate Bill</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.billGeneratedBadge}>
            <MaterialCommunityIcons name="check" size={18} color={COLORS.secondary} />
            <Text style={styles.billGeneratedText}>
              Bill {billData?.bill_number} Created
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#25D366" }]}
          onPress={handleSendBill}
          disabled={generatingBill}
        >
          {generatingBill ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="whatsapp" size={20} color={COLORS.white} />
              <Text style={styles.actionBtnText}>Send Bill via WhatsApp</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: COLORS.grayLight, marginTop: 8 }]}
          onPress={handleDone}
        >
          <Text style={[styles.actionBtnText, { color: COLORS.black }]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  successIcon: { alignItems: "center", marginTop: 24 },
  successTitle: {
    ...FONTS.h2,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 24,
    color: COLORS.secondary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    elevation: 2,
  },
  customerName: { ...FONTS.bold, fontSize: 18, marginBottom: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  summaryLabel: { ...FONTS.regular, color: COLORS.gray },
  summaryValue: { ...FONTS.medium },
  totalRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayBorder,
  },
  totalLabel: { ...FONTS.bold, fontSize: 16 },
  totalValue: { ...FONTS.bold, fontSize: 16, color: COLORS.primary },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  infoText: { ...FONTS.regular, marginLeft: 8, fontSize: 13 },
  actions: {
    marginTop: 24,
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
  },
  actionBtnText: {
    color: COLORS.white,
    ...FONTS.bold,
    fontSize: 15,
    marginLeft: 8,
  },
  billGeneratedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  billGeneratedText: {
    ...FONTS.medium,
    color: COLORS.secondary,
    marginLeft: 6,
  },
});

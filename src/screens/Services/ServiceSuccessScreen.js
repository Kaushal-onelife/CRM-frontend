import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { serviceAPI } from "../../services/api";
import { Card, Button, Badge, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

const safeNum = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

export default function ServiceSuccessScreen({ route, navigation }) {
  const { colors, spacing } = useTheme();
  const queryClient = useQueryClient();
  const toast = useToast();
  const params = route.params || {};
  const {
    serviceId,
    customerName,
    paymentStatus,
    paymentMethod,
    nextDueDate,
  } = params;
  const serviceCharge = safeNum(params.serviceCharge);
  const partsTotal = safeNum(params.partsTotal);
  const totalAmount = safeNum(params.totalAmount);

  const [generatingBill, setGeneratingBill] = useState(false);

  // Generate the bill, then hand off to the canonical Bill Details screen — the
  // single place that renders/shares the PDF invoice (expo-print). This keeps one
  // billing path across the whole app instead of a separate plain-text sender.
  const handleGenerateBill = async () => {
    setGeneratingBill(true);
    try {
      const result = await serviceAPI.generateBill({
        service_id: serviceId,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
      });
      // Refresh the bills list and dashboard so the new bill shows immediately.
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`Bill ${result.bill_number} created!`);
      // BillDetail lives in the "More" tab's stack; jump there cross-tab. Use
      // navigate (not replace) so the back button returns to this success screen.
      navigation.navigate("More", {
        screen: "BillDetail",
        params: { id: result.id },
      });
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
    setGeneratingBill(false);
  };

  const handleDone = () => {
    navigation.popToTop();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Celebratory header */}
      <Animated.View entering={ZoomIn.duration(400)} style={{ alignItems: "center", marginTop: spacing["3xl"] }}>
        <View
          style={{
            width: 104,
            height: 104,
            borderRadius: 52,
            backgroundColor: colors.successSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons name="check-circle" size={72} color={colors.success} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(400)} style={{ alignItems: "center" }}>
        <Text
          style={{
            color: colors.success,
            fontSize: 24,
            fontWeight: "800",
            letterSpacing: -0.3,
            textAlign: "center",
            marginTop: spacing.lg,
          }}
        >
          Service Completed! 🎉
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", marginTop: spacing.xs }}>
          Great work — the job is done.
        </Text>
      </Animated.View>

      {/* Summary Card */}
      <Animated.View entering={FadeInDown.delay(250).duration(400)} style={{ marginTop: spacing["2xl"] }}>
        <Card>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: spacing.md }}>
            {customerName}
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Service Charge</Text>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: "500" }}>₹{serviceCharge.toFixed(2)}</Text>
          </View>
          {partsTotal > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs }}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Parts</Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: "500" }}>₹{partsTotal.toFixed(2)}</Text>
            </View>
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: spacing.sm,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Total</Text>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "700" }}>₹{totalAmount.toFixed(2)}</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md }}>
            <Badge
              status={paymentStatus === "paid" ? "completed" : "pending"}
              label={paymentStatus === "paid" ? `Paid via ${paymentMethod?.toUpperCase()}` : "Payment Pending"}
              icon={paymentStatus === "paid" ? "check-circle" : "clock-outline"}
              size="sm"
            />
          </View>

          {nextDueDate && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md }}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.primary} />
              <Text style={{ color: colors.text, fontSize: 13, marginLeft: spacing.sm }}>
                Next Due: {nextDueDate}
              </Text>
            </View>
          )}
        </Card>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View entering={FadeInDown.delay(350).duration(400)} style={{ marginTop: spacing["2xl"], gap: spacing.md }}>
        <Button
          title="Generate Bill"
          icon="receipt"
          variant="primary"
          onPress={handleGenerateBill}
          loading={generatingBill}
          disabled={generatingBill}
        />

        <Button title="Done" variant="secondary" onPress={handleDone} />
      </Animated.View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

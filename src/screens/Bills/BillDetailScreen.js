import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { billAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import { useProfile } from "../../hooks/useProfile";
import { buildInvoiceHtml } from "../../utils/invoiceTemplate";
import { LOGO_DATA_URI } from "../../theme/logoDataUri";
import { Button, Card, Badge, EmptyState, Skeleton, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

const formatMoney = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : "₹0";
};

export default function BillDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { id } = route.params;
  const { data: profile } = useProfile();
  const [payingMethod, setPayingMethod] = useState(null);
  const [confirmingMethod, setConfirmingMethod] = useState(null);

  // Cache-first: persisted data shows instantly (incl. offline), then refreshes.
  const {
    data: bill,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["bill", id],
    queryFn: () => billAPI.getById(id),
  });

  // Two-tap confirm avoids Alert.alert, which silently drops button callbacks
  // on react-native-web. First tap arms the method; second tap commits.
  const handleMarkPaid = async (method) => {
    if (!requireOnline()) return;
    if (payingMethod) return;

    if (confirmingMethod !== method) {
      setConfirmingMethod(method);
      // Auto-cancel arming after 4s so a stray tap doesn't stay armed forever
      setTimeout(() => {
        setConfirmingMethod((current) => (current === method ? null : current));
      }, 4000);
      return;
    }

    setPayingMethod(method);
    setConfirmingMethod(null);
    try {
      await billAPI.markPaid(id, { payment_method: method });
      await refetch();
      // Also refresh the bills list and dashboard so the paid status shows there.
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["bill", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setPayingMethod(null);
    }
  };

  const [generating, setGenerating] = useState(false);

  const handleSharePdf = async () => {
    if (!bill || generating) return;
    setGenerating(true);
    try {
      const html = buildInvoiceHtml(
        bill,
        {
          business_name: profile?.tenants?.business_name,
          address: profile?.tenants?.address,
          phone: profile?.tenants?.phone,
          email: profile?.tenants?.email,
        },
        LOGO_DATA_URI
      );

      // Web has no native share sheet: open the browser print dialog so the user
      // can "Save as PDF" / print directly. Native: render a file + share sheet.
      if (Platform.OS === "web") {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: `Invoice ${bill.bill_number}`,
            UTI: "com.adobe.pdf",
          });
        } else {
          toast.success(`PDF generated at: ${uri}`);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Couldn't generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  // Skeletons only when there's no cached data yet.
  if (isLoading && !bill) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 16 }]}>
        <Skeleton width="50%" height={24} style={{ marginBottom: 20 }} />
        <Skeleton width="100%" height={90} radius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={220} radius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={56} radius={12} />
      </View>
    );
  }

  // Only show the error screen when we have NO cached data to fall back on.
  if (!bill) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, flex: 1, justifyContent: "center" }]}>
        <EmptyState
          tone="error"
          icon="file-alert-outline"
          title={error ? "Couldn't load bill" : "Bill not found"}
          message={error?.message || "This bill may have been removed."}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  const isPaid = bill.payment_status === "paid";

  const TotalRow = ({ label, value, strong }) => (
    <View style={styles.totalRow}>
      <Text
        style={{
          color: strong ? colors.text : colors.textSecondary,
          fontSize: strong ? 16 : 14,
          fontWeight: strong ? "700" : "400",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: strong ? colors.primary : colors.text,
          fontSize: strong ? 18 : 14,
          fontWeight: strong ? "800" : "500",
        }}
      >
        {value}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Invoice header */}
      <Animated.View entering={FadeInDown.duration(300)}>
        <Card style={{ marginBottom: 16 }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>INVOICE</Text>
              <Text style={{ color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 2 }}>
                {bill.bill_number}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                {new Date(bill.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Badge
              label={bill.payment_status.toUpperCase()}
              color={isPaid ? colors.success : colors.danger}
              icon={isPaid ? "check-circle-outline" : "alert-circle-outline"}
            />
          </View>
        </Card>
      </Animated.View>

      {/* Customer Info */}
      <Animated.View entering={FadeInDown.delay(60).duration(300)}>
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6 }}>
            BILL TO
          </Text>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
            {bill.customers?.name}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 2 }}>
            {bill.customers?.phone}
          </Text>
          {bill.customers?.address ? (
            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
              {bill.customers.address}
            </Text>
          ) : null}
        </Card>
      </Animated.View>

      {/* Bill Items */}
      <Animated.View entering={FadeInDown.delay(120).duration(300)}>
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 12 }}>
            Items
          </Text>
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.th, { flex: 2, color: colors.textSecondary }]}>Description</Text>
            <Text style={[styles.th, { color: colors.textSecondary, textAlign: "center" }]}>Qty</Text>
            <Text style={[styles.th, { color: colors.textSecondary, textAlign: "right" }]}>Rate</Text>
            <Text style={[styles.th, { color: colors.textSecondary, textAlign: "right" }]}>Total</Text>
          </View>
          {(bill.bill_items || []).map((item, index) => (
            <View
              key={item.id || index}
              style={[styles.tableRow, { borderBottomColor: colors.divider }]}
            >
              <Text style={[styles.td, { flex: 2, color: colors.text }]}>
                {item.description}
              </Text>
              <Text style={[styles.td, { color: colors.textSecondary, textAlign: "center" }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.td, { color: colors.textSecondary, textAlign: "right" }]}>
                {formatMoney(item.unit_price)}
              </Text>
              <Text style={[styles.td, { color: colors.text, textAlign: "right", fontWeight: "600" }]}>
                {formatMoney(item.total)}
              </Text>
            </View>
          ))}

          {/* Totals */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TotalRow label="Subtotal" value={formatMoney(bill.amount)} />
          <TotalRow label="Tax" value={formatMoney(bill.tax)} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TotalRow label="Total" value={formatMoney(bill.total)} strong />
        </Card>
      </Animated.View>

      {/* Payment Info */}
      {isPaid ? (
        <Animated.View entering={FadeInDown.delay(160).duration(300)}>
          <Card style={{ marginBottom: 16 }} accent={colors.success}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 6 }}>
              Payment
            </Text>
            <Text style={{ color: colors.success, fontSize: 14, fontWeight: "500" }}>
              Paid on {bill.paid_date} via {bill.payment_method}
            </Text>
          </Card>
        </Animated.View>
      ) : null}

      {/* Actions */}
      <Animated.View entering={FadeInDown.delay(200).duration(300)}>
        <Button
          title="Share PDF Invoice"
          icon="file-pdf-box"
          variant="secondary"
          loading={generating}
          onPress={handleSharePdf}
        />

        {!isPaid ? (
          <Card style={{ marginTop: 16 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: 4 }}>
              Mark as Paid
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 12 }}>
              {confirmingMethod
                ? `Tap ${confirmingMethod.toUpperCase()} again to confirm`
                : "Tap a method, then tap again to confirm"}
            </Text>
            <View style={styles.payMethods}>
              {["cash", "upi", "card", "online"].map((method) => {
                const isThisLoading = payingMethod === method;
                const isAnyLoading = !!payingMethod;
                const isConfirming = confirmingMethod === method;
                return (
                  <View key={method} style={styles.payMethodCell}>
                    <Button
                      title={isConfirming ? `Confirm ${method}` : method.toUpperCase()}
                      size="sm"
                      variant={isConfirming ? "primary" : "success"}
                      loading={isThisLoading}
                      disabled={isAnyLoading && !isThisLoading}
                      onPress={() => handleMarkPaid(method)}
                    />
                  </View>
                );
              })}
            </View>
          </Card>
        ) : null}
      </Animated.View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  th: { flex: 1, fontSize: 12, fontWeight: "600" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  td: { flex: 1, fontSize: 13 },
  divider: { height: 1, marginVertical: 10 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  payMethods: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  payMethodCell: {
    width: "50%",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
});

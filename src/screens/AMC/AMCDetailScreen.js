import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { amcAPI } from "../../services/api";
import { Card, Badge, Button, EmptyState, Skeleton } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

const formatMoney = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : `₹${n}`;
};

export default function AMCDetailScreen({ route, navigation }) {
  const { colors, elevation } = useTheme();
  const { id } = route.params;
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchContract = async () => {
    try {
      const data = await amcAPI.getById(id);
      setContract(data);
    } catch (error) {
      Alert.alert("Error", "Failed to load AMC details");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchContract();
    }, [id])
  );

  const getDaysRemaining = () => {
    if (!contract) return 0;
    const diff = new Date(contract.end_date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleRenew = () => {
    navigation.navigate("CreateAMC", {
      customerId: contract.customer_id,
    });
  };

  // Service-status -> Badge status preset (falls back to explicit colors).
  const serviceBadge = (status) => {
    switch (status) {
      case "scheduled":
        return { status: "upcoming" };
      case "pending":
        return { status: "pending" };
      case "in_progress":
        return { color: colors.accent, label: "In progress" };
      case "completed":
        return { status: "completed" };
      case "rejected":
        return { status: "rejected" };
      default:
        return { color: colors.gray, label: status };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 16 }]}>
        <Skeleton width="100%" height={64} radius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={180} radius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={120} radius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={120} radius={16} />
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          tone="error"
          icon="file-remove-outline"
          title="Contract not found"
          message="This AMC contract could not be loaded."
        />
      </View>
    );
  }

  // Status banner styling.
  const daysLeft = getDaysRemaining();
  const isExpiringSoon = contract.status === "active" && daysLeft <= 30 && daysLeft > 0;
  let statusColor = colors.gray;
  let statusLabel = contract.status?.toUpperCase();
  if (contract.status === "active") {
    statusColor = isExpiringSoon ? colors.warning : colors.success;
    statusLabel = isExpiringSoon ? "EXPIRING SOON" : "ACTIVE";
  } else if (contract.status === "expired") {
    statusColor = colors.danger;
    statusLabel = "EXPIRED";
  } else if (contract.status === "cancelled") {
    statusColor = colors.gray;
    statusLabel = "CANCELLED";
  }

  const servicesRemaining = contract.total_services - contract.services_used;
  const progressPct = contract.total_services
    ? (contract.services_used / contract.total_services) * 100
    : 0;

  const details = [
    { label: "Plan", value: contract.plan_name },
    { label: "Start Date", value: contract.start_date },
    { label: "End Date", value: contract.end_date },
    { label: "Amount", value: formatMoney(contract.amount) },
    { label: "Payment", value: contract.payment_status },
    { label: "Notes", value: contract.notes },
  ].filter((item) => item.value);

  const services = contract.services || [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Banner */}
      <View
        style={[
          styles.statusBanner,
          { backgroundColor: `${statusColor}1A` },
          elevation("sm"),
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        {contract.status === "active" && (
          <Text style={[styles.daysLeft, { color: colors.textSecondary }]}>
            {daysLeft > 0 ? `${daysLeft} days remaining` : "Expires today"}
          </Text>
        )}
      </View>

      {/* Contract Info */}
      <Card style={{ marginTop: 16 }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Contract Details</Text>
        {details.map((item, idx) => (
          <View
            key={item.label}
            style={[
              styles.detailRow,
              { borderBottomColor: colors.divider },
              idx === details.length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{item.value}</Text>
          </View>
        ))}
      </Card>

      {/* Service Progress */}
      <Card style={{ marginTop: 16 }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Service Usage</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.divider }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor: servicesRemaining === 0 ? colors.danger : colors.success,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {contract.services_used} of {contract.total_services} services used
            {servicesRemaining > 0 ? ` (${servicesRemaining} remaining)` : " (All used)"}
          </Text>
        </View>
      </Card>

      {/* Customer Info */}
      {contract.customers && (
        <Card style={{ marginTop: 16 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Customer</Text>
          <Text style={[styles.customerName, { color: colors.text }]}>{contract.customers.name}</Text>
          <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>
            {contract.customers.phone}
          </Text>
          {contract.customers.purifier_model && (
            <Text style={[styles.customerInfo, { color: colors.textSecondary }]}>
              {contract.customers.purifier_brand} - {contract.customers.purifier_model}
            </Text>
          )}
        </Card>
      )}

      {/* Linked Services */}
      <Card style={{ marginTop: 16 }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Scheduled Services ({services.length})
        </Text>
        {services.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No services linked to this contract
          </Text>
        ) : (
          services.map((service, idx) => {
            const b = serviceBadge(service.status);
            return (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceRow,
                  { borderBottomColor: colors.divider },
                  idx === services.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() =>
                  navigation.navigate("Services", {
                    screen: "ServiceDetail",
                    params: { id: service.id },
                  })
                }
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.serviceType, { color: colors.text }]}>
                    {(service.service_type || "").replace(/_/g, " ")}
                  </Text>
                  <Text style={[styles.serviceDate, { color: colors.textSecondary }]}>
                    {service.scheduled_date}
                  </Text>
                </View>
                <Badge {...b} size="sm" />
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.textMuted}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            );
          })
        )}
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        {contract.status === "active" && contract.payment_status !== "paid" && (
          <Button
            title="Mark as Paid"
            variant="success"
            icon="cash-check"
            onPress={() => {
              Alert.alert("Mark Paid", "Mark this AMC as paid?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Confirm",
                  onPress: async () => {
                    try {
                      await amcAPI.update(id, { payment_status: "paid" });
                      fetchContract();
                    } catch (error) {
                      Alert.alert("Error", error.message);
                    }
                  },
                },
              ]);
            }}
          />
        )}

        {(contract.status === "expired" || daysLeft <= 30) && (
          <Button
            title="Renew Contract"
            variant="primary"
            icon="autorenew"
            onPress={handleRenew}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  statusBanner: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 4,
  },
  statusText: { fontSize: 15, fontWeight: "700", letterSpacing: 1 },
  daysLeft: { fontSize: 13, marginTop: 2 },
  cardTitle: { fontSize: 17, fontWeight: "600", marginBottom: 12 },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: { fontSize: 14, width: 110 },
  detailValue: { fontSize: 14, flex: 1, textTransform: "capitalize" },
  progressContainer: { marginTop: 4 },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 5 },
  progressText: { fontSize: 13, marginTop: 8 },
  customerName: { fontSize: 16, fontWeight: "700" },
  customerPhone: { fontSize: 14, marginTop: 2 },
  customerInfo: { fontSize: 13, marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: "center", paddingVertical: 16 },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  serviceType: { fontSize: 14, fontWeight: "500", textTransform: "capitalize" },
  serviceDate: { fontSize: 13, marginTop: 2 },
  actions: { marginTop: 20, gap: 12 },
});

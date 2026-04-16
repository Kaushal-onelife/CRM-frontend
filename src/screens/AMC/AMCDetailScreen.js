import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { amcAPI } from "../../services/api";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

const STATUS_COLORS = {
  active: COLORS.secondary,
  expired: COLORS.danger,
  cancelled: COLORS.gray,
};

const SERVICE_STATUS_COLORS = {
  scheduled: COLORS.primary,
  pending: COLORS.warning,
  in_progress: "#8B5CF6",
  completed: COLORS.secondary,
  rejected: COLORS.danger,
};

export default function AMCDetailScreen({ route, navigation }) {
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!contract) {
    return (
      <View style={styles.centered}>
        <Text>Contract not found</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[contract.status] || COLORS.gray;
  const daysLeft = getDaysRemaining();
  const servicesRemaining = contract.total_services - contract.services_used;

  return (
    <ScrollView style={styles.container}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusColor + "15" }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {contract.status.toUpperCase()}
        </Text>
        {contract.status === "active" && (
          <Text style={styles.daysLeft}>
            {daysLeft > 0 ? `${daysLeft} days remaining` : "Expires today"}
          </Text>
        )}
      </View>

      {/* Contract Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contract Details</Text>
        {[
          { label: "Plan", value: contract.plan_name },
          { label: "Start Date", value: contract.start_date },
          { label: "End Date", value: contract.end_date },
          { label: "Amount", value: `Rs ${contract.amount}` },
          { label: "Payment", value: contract.payment_status },
          { label: "Notes", value: contract.notes },
        ]
          .filter((item) => item.value)
          .map((item) => (
            <View key={item.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
      </View>

      {/* Service Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service Usage</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(contract.services_used / contract.total_services) * 100}%`,
                  backgroundColor:
                    servicesRemaining === 0 ? COLORS.danger : COLORS.secondary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {contract.services_used} of {contract.total_services} services used
            {servicesRemaining > 0
              ? ` (${servicesRemaining} remaining)`
              : " (All used)"}
          </Text>
        </View>
      </View>

      {/* Customer Info */}
      {contract.customers && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <Text style={styles.customerName}>{contract.customers.name}</Text>
          <Text style={styles.customerPhone}>{contract.customers.phone}</Text>
          {contract.customers.purifier_model && (
            <Text style={styles.customerInfo}>
              {contract.customers.purifier_brand} - {contract.customers.purifier_model}
            </Text>
          )}
        </View>
      )}

      {/* Linked Services */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Scheduled Services ({(contract.services || []).length})
        </Text>
        {(contract.services || []).length === 0 ? (
          <Text style={styles.emptyText}>No services linked to this contract</Text>
        ) : (
          contract.services.map((service) => {
            const sColor = SERVICE_STATUS_COLORS[service.status] || COLORS.gray;
            return (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceRow}
                onPress={() =>
                  navigation.navigate("Services", {
                    screen: "ServiceDetail",
                    params: { id: service.id },
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceType}>
                    {service.service_type.replace(/_/g, " ")}
                  </Text>
                  <Text style={styles.serviceDate}>{service.scheduled_date}</Text>
                </View>
                <View style={[styles.serviceBadge, { backgroundColor: sColor + "20" }]}>
                  <Text style={[styles.serviceBadgeText, { color: sColor }]}>
                    {service.status}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {contract.status === "active" && contract.payment_status !== "paid" && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
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
          >
            <Text style={styles.actionBtnText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}

        {(contract.status === "expired" || daysLeft <= 30) && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
            onPress={handleRenew}
          >
            <Text style={styles.actionBtnText}>Renew Contract</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  statusBanner: { paddingVertical: 12, alignItems: "center" },
  statusText: { fontSize: 14, fontWeight: "700", letterSpacing: 1 },
  daysLeft: { ...FONTS.small, marginTop: 4 },
  card: {
    backgroundColor: COLORS.white,
    margin: SIZES.padding,
    marginBottom: 0,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    elevation: 1,
  },
  cardTitle: { ...FONTS.h3, marginBottom: 12 },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  detailLabel: { ...FONTS.regular, color: COLORS.gray, width: 110 },
  detailValue: { ...FONTS.regular, flex: 1, textTransform: "capitalize" },
  progressContainer: { marginTop: 4 },
  progressBar: {
    height: 10,
    backgroundColor: COLORS.grayLight,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 5 },
  progressText: { ...FONTS.small, color: COLORS.gray, marginTop: 8 },
  customerName: { ...FONTS.bold, fontSize: 16 },
  customerPhone: { ...FONTS.regular, color: COLORS.gray, marginTop: 2 },
  customerInfo: { ...FONTS.small, color: COLORS.gray, marginTop: 4 },
  emptyText: { ...FONTS.regular, color: COLORS.gray, textAlign: "center", paddingVertical: 16 },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  serviceType: { ...FONTS.medium, textTransform: "capitalize" },
  serviceDate: { ...FONTS.small, color: COLORS.gray, marginTop: 2 },
  serviceBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  serviceBadgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  actions: { padding: SIZES.padding, gap: 10 },
  actionBtn: { borderRadius: 8, padding: 14, alignItems: "center" },
  actionBtnText: { color: COLORS.white, ...FONTS.bold },
});

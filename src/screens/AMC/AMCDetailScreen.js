import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { amcAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import { Card, Badge, Button, EmptyState, Skeleton, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import { confirm } from "../../utils/confirm";
import { tint } from "../../utils/color";

const formatMoney = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : `₹${n}`;
};

export default function AMCDetailScreen({ route, navigation }) {
  const { colors, elevation } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { id } = route.params;

  // Cache-first: persisted contract shows instantly (incl. offline), then refreshes.
  const {
    data: contract,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["amc", id],
    queryFn: () => amcAPI.getById(id),
  });

  const getDaysRemaining = () => {
    if (!contract) return 0;
    const diff = new Date(contract.end_date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleEdit = () => {
    navigation.navigate("EditAMC", { contract });
  };

  const handleDelete = () => {
    if (!requireOnline()) return;
    confirm({
      title: "Delete AMC",
      message:
        "Delete this AMC contract and its scheduled visits? Any bill already generated stays in Bills (delete it there if needed). This can't be undone.",
      confirmText: "Delete",
      destructive: true,
      onConfirm: async () => {
        try {
          await amcAPI.remove(id);
          queryClient.invalidateQueries({ queryKey: ["amc"] });
          queryClient.invalidateQueries({ queryKey: ["services"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: ["reminders"] });
          toast.success("AMC contract deleted");
          navigation.goBack();
        } catch (error) {
          // 409 = guarded (completed visits / already renewed) — show the reason.
          toast.error(error.message || "Couldn't delete this contract.");
        }
      },
    });
  };

  const handleRenew = () => {
    // Open CreateAMC in RENEW mode — prefilled from this contract, customer
    // locked, submit calls amcAPI.renew(oldId,...) which creates the new linked
    // contract and closes this one out.
    navigation.navigate("CreateAMC", {
      renewFrom: contract.id,
      customerId: contract.customer_id,
      customerName: contract.customers?.name,
      prefill: {
        plan_name: contract.plan_name,
        total_services: String(contract.total_services),
        amount: contract.amount != null ? String(contract.amount) : "",
        start_date: contract.end_date, // CreateAMC will default new start = old end + 1
        notes: contract.notes || "",
      },
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

  if (isLoading && !contract) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 16 }]}>
        <Skeleton width="100%" height={64} radius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={180} radius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={120} radius={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={120} radius={16} />
      </View>
    );
  }

  if (error && !contract) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <EmptyState
          tone="error"
          icon="file-remove-outline"
          title="Contract not found"
          message={error.message || "This AMC contract could not be loaded."}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
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

  // services_used + services_remaining come computed from the API (from actual
  // completed visits). Fall back to a local calc + clamp so the bar never breaks.
  const servicesRemaining =
    contract.services_remaining ??
    Math.max(0, (contract.total_services || 0) - (contract.services_used || 0));
  const progressPct = contract.total_services
    ? Math.min(100, ((contract.services_used || 0) / contract.total_services) * 100)
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
          { backgroundColor: tint(statusColor, 0.1) },
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
        {/* Title row with Edit/Delete as compact icon actions. Edit hidden once
            renewed (closed); Delete is guarded server-side. */}
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
            Contract Details
          </Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {!contract.renewed_to && (
              <TouchableOpacity
                onPress={handleEdit}
                hitSlop={8}
                style={[styles.iconAction, { backgroundColor: tint(colors.primary, 0.12) }]}
              >
                <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={8}
              style={[styles.iconAction, { backgroundColor: tint(colors.danger, 0.12) }]}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
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
              if (!requireOnline()) return;
              confirm({
                title: "Mark Paid",
                message: "Mark this AMC as paid?",
                confirmText: "Confirm",
                onConfirm: async () => {
                  try {
                    await amcAPI.update(id, { payment_status: "paid" });
                    refetch();
                    // Also refresh the AMC list and dashboard so the paid status shows there.
                    queryClient.invalidateQueries({ queryKey: ["amc"] });
                    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                  } catch (error) {
                    toast.error(error.message || "Something went wrong");
                  }
                },
              });
            }}
          />
        )}

        {/* Renew — only when NOT already renewed. An already-renewed contract is
            closed; offering Renew again would create a duplicate chain. */}
        {!contract.renewed_to && (contract.status === "expired" || daysLeft <= 30) && (
          <Button
            title="Renew Contract"
            variant="primary"
            icon="autorenew"
            onPress={handleRenew}
          />
        )}

        {/* Already renewed -> link to the contract that replaced this one. */}
        {contract.renewed_to && (
          <TouchableOpacity
            onPress={() =>
              navigation.replace("AMCDetail", { id: contract.renewed_to.id })
            }
            activeOpacity={0.7}
            style={[
              styles.renewedBanner,
              { backgroundColor: tint(colors.success, 0.1), borderColor: colors.success },
            ]}
          >
            <MaterialCommunityIcons name="check-decagram" size={18} color={colors.success} />
            <Text style={[styles.renewedText, { color: colors.success }]}>
              Renewed — view new contract
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.success} />
          </TouchableOpacity>
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
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
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
  renewedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  renewedText: { fontWeight: "700", fontSize: 14 },
});

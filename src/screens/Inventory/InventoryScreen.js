import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { inventoryAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import { useTheme } from "../../context/ThemeContext";
import { confirm } from "../../utils/confirm";
import { Button, Card, Badge, Input, EmptyState, SkeletonList } from "../../components/ui";
import {
  isRequired,
  isNonNegativeNumber,
  isIntegerInRange,
  firstError,
} from "../../utils/validators";

const formatMoney = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : "₹0";
};

export default function InventoryScreen() {
  const { colors, radius, elevation } = useTheme();

  // Cache-first: persisted inventory shows instantly (incl. offline), then refreshes.
  const {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => inventoryAPI.getAll(),
  });
  const parts = data?.parts || [];
  const lowStockCount = data?.low_stock_count || 0;

  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    quantity: "",
    min_stock: "5",
    unit_price: "",
    cost_price: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Per-field validation — returns an error string or null. Used on blur + submit.
  const validateField = (key, value) => {
    const v = (value || "").trim();
    switch (key) {
      case "name":
        return isRequired(v, "Part name");
      case "quantity":
        return isIntegerInRange(v || "0", 0, 999999, "Quantity");
      case "min_stock":
        return isIntegerInRange(v || "0", 0, 999999, "Min stock");
      case "unit_price":
        return isNonNegativeNumber(v || "0", "Unit price");
      case "cost_price":
        return isNonNegativeNumber(v || "0", "Cost price");
      default:
        return null;
    }
  };

  // Update a form field, applying input filtering, and clear its error on edit.
  const updateForm = (key, value) => {
    let v = value;
    if (key === "quantity" || key === "min_stock") v = v.replace(/[^0-9]/g, "");
    else if (key === "unit_price" || key === "cost_price") v = v.replace(/[^0-9.]/g, "");
    setForm((prev) => ({ ...prev, [key]: v }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleBlur = (key) => {
    setErrors((prev) => ({ ...prev, [key]: validateField(key, form[key]) }));
  };

  const openAddModal = () => {
    setEditingPart(null);
    setForm({ name: "", sku: "", quantity: "", min_stock: "5", unit_price: "", cost_price: "" });
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (part) => {
    setEditingPart(part);
    setErrors({});
    setForm({
      name: part.name,
      sku: part.sku || "",
      quantity: String(part.quantity),
      min_stock: String(part.min_stock),
      unit_price: String(part.unit_price),
      cost_price: String(part.cost_price),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!requireOnline()) return;
    const name = form.name.trim();
    const sku = form.sku.trim();

    // Validate every field; collect all errors so they all light up at once.
    const nextErrors = {};
    for (const key of ["name", "quantity", "min_stock", "unit_price", "cost_price"]) {
      const err = validateField(key, form[key]);
      if (err) nextErrors[key] = err;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const unitPrice = parseFloat(form.unit_price) || 0;
    const costPrice = parseFloat(form.cost_price) || 0;
    if (unitPrice > 0 && costPrice > unitPrice) {
      // Warn but don't block — sometimes a part is sold at a loss intentionally
      const proceed = await new Promise((resolve) => {
        confirm({
          title: "Cost exceeds price",
          message: `Cost (₹${costPrice}) is higher than selling price (₹${unitPrice}). Save anyway?`,
          confirmText: "Save",
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (!proceed) return;
    }

    setSaving(true);
    try {
      const body = {
        name,
        sku,
        quantity: parseInt(form.quantity, 10) || 0,
        min_stock: parseInt(form.min_stock, 10) || 5,
        unit_price: unitPrice,
        cost_price: costPrice,
      };

      if (editingPart) {
        await inventoryAPI.update(editingPart.id, body);
      } else {
        await inventoryAPI.create(body);
      }

      setShowModal(false);
      refetch();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setSaving(false);
  };

  const handleDelete = (part) => {
    if (deletingId) return;
    if (!requireOnline()) return;
    confirm({
      title: "Delete Part",
      message: `Delete "${part.name}" from inventory?`,
      confirmText: "Delete",
      destructive: true,
      onConfirm: async () => {
        setDeletingId(part.id);
        try {
          await inventoryAPI.delete(part.id);
          await refetch();
        } catch (error) {
          Alert.alert("Error", error.message);
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const renderPart = ({ item }) => {
    const isLow = item.quantity <= item.min_stock;
    const isDeleting = deletingId === item.id;
    return (
      <Card onPress={() => openEditModal(item)} padded={false} style={{ marginBottom: 12 }}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.partName, { color: colors.text }]}>{item.name}</Text>
            {item.sku ? (
              <Text style={[styles.sku, { color: colors.textSecondary }]}>SKU: {item.sku}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            disabled={isDeleting || !!deletingId}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isDeleting ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : (
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color={colors.danger}
                style={deletingId ? { opacity: 0.4 } : null}
              />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>In Stock</Text>
            <Text
              style={[
                styles.statValue,
                { color: colors.text },
                isLow && { color: colors.danger },
              ]}
            >
              {item.quantity}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Min Stock</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{item.min_stock}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sell Price</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatMoney(item.unit_price)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Cost</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatMoney(item.cost_price)}</Text>
          </View>
        </View>
        {isLow && (
          <View style={[styles.lowStockBar, { backgroundColor: colors.dangerSoft }]}>
            <MaterialCommunityIcons name="alert-outline" size={14} color={colors.danger} />
            <Text style={[styles.lowStockText, { color: colors.danger }]}>
              Low stock! Only {item.quantity} left (min: {item.min_stock})
            </Text>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {lowStockCount > 0 && (
        <View style={[styles.alertBanner, { backgroundColor: colors.warningSoft }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.warning} />
          <Text style={[styles.alertText, { color: colors.warning }]}>
            {lowStockCount} part{lowStockCount > 1 ? "s" : ""} running low on stock
          </Text>
        </View>
      )}

      {isLoading && !data ? (
        <View style={{ padding: 16 }}>
          <SkeletonList count={5} />
        </View>
      ) : error && !data ? (
        <EmptyState
          tone="error"
          icon="cloud-off-outline"
          title="Couldn't load inventory"
          message={error.message || "Failed to load inventory"}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={parts}
          keyExtractor={(item) => item.id}
          renderItem={renderPart}
          ListEmptyComponent={
            <EmptyState
              icon="package-variant"
              title="No parts in inventory"
              message="Tap the + button to add filters and parts."
              actionLabel="Add Part"
              onAction={openAddModal}
            />
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              tintColor={colors.primary}
              onRefresh={() => refetch()}
            />
          }
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, elevation("lg")]}
        onPress={openAddModal}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
            ]}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingPart ? "Edit Part" : "Add Part"}
            </Text>

            <Input
              label="Name *"
              placeholder="e.g. RO Membrane"
              icon="tag-outline"
              value={form.name}
              error={errors.name}
              onChangeText={(v) => updateForm("name", v)}
              onBlur={() => handleBlur("name")}
            />

            <Input
              label="SKU (optional)"
              placeholder="e.g. RO-MEM-001"
              icon="barcode"
              value={form.sku}
              onChangeText={(v) => setForm({ ...form, sku: v })}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Quantity"
                  placeholder="0"
                  value={form.quantity}
                  error={errors.quantity}
                  onChangeText={(v) => updateForm("quantity", v)}
                  onBlur={() => handleBlur("quantity")}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Input
                  label="Min Stock"
                  placeholder="5"
                  value={form.min_stock}
                  error={errors.min_stock}
                  onChangeText={(v) => updateForm("min_stock", v)}
                  onBlur={() => handleBlur("min_stock")}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Sell Price (₹)"
                  placeholder="0"
                  value={form.unit_price}
                  error={errors.unit_price}
                  onChangeText={(v) => updateForm("unit_price", v)}
                  onBlur={() => handleBlur("unit_price")}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Input
                  label="Cost Price (₹)"
                  placeholder="0"
                  value={form.cost_price}
                  error={errors.cost_price}
                  onChangeText={(v) => updateForm("cost_price", v)}
                  onBlur={() => handleBlur("cost_price")}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setShowModal(false)}
                />
              </View>
              <View style={{ flex: 2, marginLeft: 12 }}>
                <Button
                  title={editingPart ? "Update" : "Add Part"}
                  onPress={handleSave}
                  loading={saving}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
  },
  alertText: { fontSize: 13, fontWeight: "500" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  partName: { fontSize: 15, fontWeight: "700" },
  sku: { fontSize: 12, marginTop: 2 },
  cardBody: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 4,
  },
  stat: { flex: 1, alignItems: "center" },
  statLabel: { fontSize: 10 },
  statValue: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  lowStockBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 8,
  },
  lowStockText: { fontSize: 12, fontWeight: "600" },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: 20,
    maxHeight: "85%",
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(128,128,128,0.4)",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  row: { flexDirection: "row" },
  modalActions: {
    flexDirection: "row",
    marginTop: 12,
  },
});

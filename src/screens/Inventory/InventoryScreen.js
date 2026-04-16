import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { inventoryAPI } from "../../services/api";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

export default function InventoryScreen() {
  const [parts, setParts] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [saving, setSaving] = useState(false);

  const fetchParts = async () => {
    try {
      const result = await inventoryAPI.getAll();
      setParts(result.parts);
      setLowStockCount(result.low_stock_count);
    } catch (error) {
      Alert.alert("Error", "Failed to load inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchParts();
    }, [])
  );

  const openAddModal = () => {
    setEditingPart(null);
    setForm({ name: "", sku: "", quantity: "", min_stock: "5", unit_price: "", cost_price: "" });
    setShowModal(true);
  };

  const openEditModal = (part) => {
    setEditingPart(part);
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
    if (!form.name) {
      Alert.alert("Error", "Part name is required");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: form.name,
        sku: form.sku,
        quantity: parseInt(form.quantity) || 0,
        min_stock: parseInt(form.min_stock) || 5,
        unit_price: parseFloat(form.unit_price) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
      };

      if (editingPart) {
        await inventoryAPI.update(editingPart.id, body);
      } else {
        await inventoryAPI.create(body);
      }

      setShowModal(false);
      fetchParts();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setSaving(false);
  };

  const handleDelete = (part) => {
    Alert.alert("Delete Part", `Delete "${part.name}" from inventory?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await inventoryAPI.delete(part.id);
            fetchParts();
          } catch (error) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const renderPart = ({ item }) => {
    const isLow = item.quantity <= item.min_stock;
    return (
      <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.partName}>{item.name}</Text>
            {item.sku ? <Text style={styles.sku}>SKU: {item.sku}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => handleDelete(item)}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>In Stock</Text>
            <Text
              style={[
                styles.statValue,
                isLow && { color: COLORS.danger },
              ]}
            >
              {item.quantity}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Min Stock</Text>
            <Text style={styles.statValue}>{item.min_stock}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Sell Price</Text>
            <Text style={styles.statValue}>Rs {item.unit_price}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Cost</Text>
            <Text style={styles.statValue}>Rs {item.cost_price}</Text>
          </View>
        </View>
        {isLow && (
          <View style={styles.lowStockBar}>
            <Text style={styles.lowStockText}>
              Low stock! Only {item.quantity} left (min: {item.min_stock})
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {lowStockCount > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            {lowStockCount} part{lowStockCount > 1 ? "s" : ""} running low on stock
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={parts}
          keyExtractor={(item) => item.id}
          renderItem={renderPart}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No parts in inventory. Tap + to add parts.
            </Text>
          }
          contentContainerStyle={{ padding: SIZES.padding, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchParts(); }} />
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingPart ? "Edit Part" : "Add Part"}
            </Text>

            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. RO Membrane"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />

            <Text style={styles.label}>SKU (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. RO-MEM-001"
              value={form.sku}
              onChangeText={(v) => setForm({ ...form, sku: v })}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={form.quantity}
                  onChangeText={(v) => setForm({ ...form, quantity: v })}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.label}>Min Stock</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5"
                  value={form.min_stock}
                  onChangeText={(v) => setForm({ ...form, min_stock: v })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Sell Price (Rs)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={form.unit_price}
                  onChangeText={(v) => setForm({ ...form, unit_price: v })}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.label}>Cost Price (Rs)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={form.cost_price}
                  onChangeText={(v) => setForm({ ...form, cost_price: v })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingPart ? "Update" : "Add Part"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  alertBanner: {
    backgroundColor: COLORS.warning + "15",
    padding: 12,
    alignItems: "center",
  },
  alertText: { ...FONTS.medium, color: COLORS.warning, fontSize: 13 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: 10,
    elevation: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SIZES.padding,
    paddingBottom: 8,
  },
  partName: { ...FONTS.bold, fontSize: 15 },
  sku: { ...FONTS.small, color: COLORS.gray, marginTop: 2 },
  deleteText: { ...FONTS.small, color: COLORS.danger },
  cardBody: {
    flexDirection: "row",
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding,
    gap: 4,
  },
  stat: { flex: 1, alignItems: "center" },
  statLabel: { ...FONTS.small, color: COLORS.gray, fontSize: 10 },
  statValue: { ...FONTS.bold, fontSize: 14, marginTop: 2 },
  lowStockBar: {
    backgroundColor: COLORS.danger + "10",
    padding: 6,
    alignItems: "center",
  },
  lowStockText: { ...FONTS.small, color: COLORS.danger, fontWeight: "600" },
  emptyText: { ...FONTS.regular, color: COLORS.gray, textAlign: "center", marginTop: 40 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: "300", marginTop: -2 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SIZES.padding * 1.5,
    maxHeight: "80%",
  },
  modalTitle: { ...FONTS.h2, marginBottom: 8 },
  label: { ...FONTS.medium, marginBottom: 4, marginTop: 10, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: COLORS.grayLight,
  },
  row: { flexDirection: "row" },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    backgroundColor: COLORS.grayLight,
  },
  cancelBtnText: { ...FONTS.bold, color: COLORS.gray },
  saveBtn: {
    flex: 2,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  saveBtnText: { ...FONTS.bold, color: COLORS.white },
});

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { customerAPI, billAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import { Button, Card, Input, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import {
  isRequired,
  isIntegerInRange,
  isPositiveNumber,
  isNonNegativeNumber,
} from "../../utils/validators";

const formatMoney = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₹0.00";
};

export default function CreateBillScreen({ route, navigation }) {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const preCustomerId = route.params?.customerId;
  const preServiceId = route.params?.serviceId;

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(preCustomerId || null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [items, setItems] = useState([
    { description: "", quantity: "1", unit_price: "" },
  ]);
  const [tax, setTax] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState("unpaid"); // 'unpaid' | 'paid'
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  // Errors keyed per line item by index, e.g. itemErrors[0] = { description, quantity, unit_price }.
  const [itemErrors, setItemErrors] = useState({});
  const [taxError, setTaxError] = useState(null);

  // Per-field validation for a line item — returns an error string or null.
  const validateItemField = (key, value) => {
    const v = (value || "").trim();
    switch (key) {
      case "description":
        return isRequired(v, "Description");
      case "quantity":
        return isRequired(v, "Quantity") || isIntegerInRange(v, 1, 999999, "Quantity");
      case "unit_price":
        return isRequired(v, "Unit price") || isPositiveNumber(v, "Unit price");
      default:
        return null;
    }
  };

  const validateTax = (value) => isNonNegativeNumber((value || "").trim() || "0", "Tax");

  useEffect(() => {
    if (!preCustomerId) fetchCustomers();
  }, []);

  const fetchCustomers = async (search = "") => {
    setSearching(true);
    try {
      const params = search ? `search=${search}` : "";
      const result = await customerAPI.getAll(params);
      setCustomers(result.customers || []);
    } catch (error) {
      console.error(error.message);
      setCustomers([]);
    } finally {
      setSearching(false);
    }
  };

  const updateItem = (index, key, value) => {
    let v = value;
    // Quantity: digits only. Unit price: numeric (digits + decimal point).
    if (key === "quantity") v = v.replace(/[^0-9]/g, "");
    else if (key === "unit_price") v = v.replace(/[^0-9.]/g, "");
    const updated = [...items];
    updated[index][key] = v;
    setItems(updated);
    // Clear this field's error as soon as the user edits it.
    if (itemErrors[index]?.[key]) {
      setItemErrors((prev) => ({
        ...prev,
        [index]: { ...prev[index], [key]: null },
      }));
    }
  };

  const handleItemBlur = (index, key) => {
    const err = validateItemField(key, items[index][key]);
    setItemErrors((prev) => ({
      ...prev,
      [index]: { ...prev[index], [key]: err },
    }));
  };

  const updateTax = (value) => {
    setTax(value.replace(/[^0-9.]/g, ""));
    if (taxError) setTaxError(null);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: "1", unit_price: "" }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
    // Drop the removed row's errors so stale messages don't linger.
    setItemErrors((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        const i = Number(k);
        if (i < index) next[i] = prev[k];
        else if (i > index) next[i - 1] = prev[k];
      });
      return next;
    });
  };

  const getSubtotal = () =>
    items.reduce(
      (sum, item) =>
        sum + (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0),
      0
    );

  const handleSubmit = async () => {
    if (!requireOnline()) return;
    if (!selectedCustomer) {
      toast.error("Please select a customer from the search results.");
      return;
    }

    // Per-item validation — collect inline errors so they all light up at once.
    const nextItemErrors = {};
    let hasItemError = false;
    items.forEach((item, i) => {
      const rowErr = {};
      for (const key of ["description", "quantity", "unit_price"]) {
        const err = validateItemField(key, item[key]);
        if (err) {
          rowErr[key] = err;
          hasItemError = true;
        }
      }
      if (Object.keys(rowErr).length > 0) nextItemErrors[i] = rowErr;
    });
    setItemErrors(nextItemErrors);

    const tErr = validateTax(tax);
    setTaxError(tErr);

    if (hasItemError || tErr) return;

    const taxValue = parseFloat(tax) || 0;

    setLoading(true);
    try {
      const billItems = items.map((item) => ({
        description: item.description.trim(),
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
      }));

      const result = await billAPI.create({
        customer_id: selectedCustomer,
        service_id: preServiceId || null,
        tax: taxValue,
        payment_status: paymentStatus,
        payment_method: paymentStatus === "paid" ? paymentMethod : null,
        items: billItems,
      });

      // Refresh the lists that this new bill affects so it shows immediately.
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success(`Bill ${result.bill_number} created`);
      navigation.goBack();
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
    setLoading(false);
  };

  const subtotal = getSubtotal();
  const total = subtotal + (parseFloat(tax) || 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Customer Selection */}
      {!preCustomerId && (
        <View>
          <Input
            label="Select Customer *"
            icon="account-search-outline"
            placeholder="Search customer..."
            value={customerSearch}
            style={{ marginBottom: 0 }}
            onChangeText={(text) => {
              setCustomerSearch(text);
              // Editing the search clears any previous selection so the user
              // can't submit a stale customer_id that doesn't match what they see.
              if (selectedCustomer) setSelectedCustomer(null);
              if (text.length > 2) {
                setShowDropdown(true);
                fetchCustomers(text);
              } else {
                setShowDropdown(false);
              }
            }}
          />

          {selectedCustomer && !showDropdown && (
            <View style={[styles.selectedBadge, { backgroundColor: colors.successSoft }]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color={colors.success}
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: colors.success, fontSize: 13, fontWeight: "600" }}>
                  Customer selected
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedCustomer(null);
                  setCustomerSearch("");
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {showDropdown && customerSearch.length > 2 && (
            <View
              style={[
                styles.dropdown,
                { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md },
              ]}
            >
              {searching ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ padding: 12 }}
                />
              ) : customers.length === 0 ? (
                <Text style={{ color: colors.textMuted, padding: 12, textAlign: "center", fontSize: 14 }}>
                  No customers found
                </Text>
              ) : (
                customers.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: colors.divider },
                      selectedCustomer === c.id && { backgroundColor: colors.primarySoft },
                    ]}
                    onPress={() => {
                      setSelectedCustomer(c.id);
                      setCustomerSearch(`${c.name} - ${c.phone}`);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 14 }}>
                      {c.name} - {c.phone}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {!showDropdown && !selectedCustomer && customerSearch.length <= 2 && (
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6, fontStyle: "italic" }}>
              Type at least 3 characters to search
            </Text>
          )}
        </View>
      )}

      {/* Line Items */}
      <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 24 }]}>
        Bill Items
      </Text>
      {items.map((item, index) => (
        <Card
          key={index}
          elevated={false}
          style={{ marginBottom: 12, borderWidth: 1, borderColor: colors.border }}
        >
          <View style={styles.itemHeader}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
              Item {index + 1}
            </Text>
            {items.length > 1 && (
              <TouchableOpacity
                onPress={() => removeItem(index)}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.danger} />
                <Text style={{ color: colors.danger, fontSize: 13, marginLeft: 4 }}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          <Input
            placeholder="Description (e.g. RO Filter)"
            value={item.description}
            error={itemErrors[index]?.description}
            onChangeText={(v) => updateItem(index, "description", v)}
            onBlur={() => handleItemBlur(index, "description")}
            style={{ marginBottom: 12 }}
          />
          <View style={styles.itemRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Input
                label="Qty"
                value={item.quantity}
                error={itemErrors[index]?.quantity}
                onChangeText={(v) => updateItem(index, "quantity", v)}
                onBlur={() => handleItemBlur(index, "quantity")}
                keyboardType="numeric"
                style={{ marginBottom: 0 }}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Input
                label="Unit Price (₹)"
                placeholder="0"
                value={item.unit_price}
                error={itemErrors[index]?.unit_price}
                onChangeText={(v) => updateItem(index, "unit_price", v)}
                onBlur={() => handleItemBlur(index, "unit_price")}
                keyboardType="numeric"
                style={{ marginBottom: 0 }}
              />
            </View>
          </View>
        </Card>
      ))}

      <TouchableOpacity
        style={[styles.addItemBtn, { borderColor: colors.primary, borderRadius: radius.md }]}
        onPress={addItem}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
        <Text style={{ color: colors.primary, fontWeight: "600", marginLeft: 4 }}>Add Item</Text>
      </TouchableOpacity>

      {/* Tax */}
      <Input
        label="Tax (₹)"
        placeholder="0"
        value={tax}
        error={taxError}
        onChangeText={updateTax}
        onBlur={() => setTaxError(validateTax(tax))}
        keyboardType="numeric"
        style={{ marginTop: 20 }}
      />

      {/* Payment status */}
      <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 8 }]}>
        Payment Status
      </Text>
      <View style={styles.segment}>
        {[
          { key: "unpaid", label: "Unpaid", color: colors.danger },
          { key: "paid", label: "Paid", color: colors.success },
        ].map((opt) => {
          const active = paymentStatus === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              activeOpacity={0.7}
              onPress={() => setPaymentStatus(opt.key)}
              style={[
                styles.segmentBtn,
                {
                  backgroundColor: active ? opt.color : colors.card,
                  borderColor: active ? opt.color : colors.border,
                  borderRadius: radius.md,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={opt.key === "paid" ? "check-circle-outline" : "clock-outline"}
                size={16}
                color={active ? colors.onPrimary : colors.textSecondary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: active ? colors.onPrimary : colors.textSecondary,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Payment method — only when marking paid */}
      {paymentStatus === "paid" && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Payment Method</Text>
          <View style={styles.methodGrid}>
            {["cash", "upi", "card", "online"].map((m) => {
              const active = paymentMethod === m;
              return (
                <TouchableOpacity
                  key={m}
                  activeOpacity={0.7}
                  onPress={() => setPaymentMethod(m)}
                  style={[
                    styles.methodChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.onPrimary : colors.textSecondary,
                      fontWeight: active ? "600" : "500",
                      fontSize: 13,
                      textTransform: "uppercase",
                    }}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Summary */}
      <Card style={{ marginTop: 8 }}>
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Subtotal</Text>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: "500" }}>
            {formatMoney(subtotal)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Tax</Text>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: "500" }}>
            {formatMoney(parseFloat(tax) || 0)}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryRow}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Total</Text>
          <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "800" }}>
            {formatMoney(total)}
          </Text>
        </View>
      </Card>

      <Button
        title="Generate Bill"
        icon="file-document-outline"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={{ marginTop: 24 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 15, fontWeight: "600", marginBottom: 10 },
  dropdown: {
    borderWidth: 1,
    marginTop: 6,
    maxHeight: 180,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  selectedBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemRow: { flexDirection: "row" },
  addItemBtn: {
    flexDirection: "row",
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  divider: { height: 1, marginVertical: 10 },
  segment: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderWidth: 1,
  },
  methodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  methodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
});

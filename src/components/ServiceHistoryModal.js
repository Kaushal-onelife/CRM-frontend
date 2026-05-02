import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serviceAPI } from "../services/api";
import { COLORS, FONTS, SIZES } from "../constants/theme";

export default function ServiceHistoryModal({ visible, onClose, customerId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && customerId) {
      fetchHistory();
    }
  }, [visible, customerId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const result = await serviceAPI.getCustomerHistory(customerId);
      setHistory(result.services);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const parts = item.parts_replaced || [];
    return (
      <View style={styles.historyItem}>
        <View style={styles.historyHeader}>
          <View style={styles.historyDateBadge}>
            <MaterialCommunityIcons name="calendar" size={14} color={COLORS.primary} />
            <Text style={styles.historyDate}>{item.completed_date || item.scheduled_date}</Text>
          </View>
          <View style={styles.historyTypeBadge}>
            <Text style={styles.historyType}>
              {item.service_type.replace(/_/g, " ")}
            </Text>
          </View>
        </View>

        {item.amount > 0 && (
          <View style={styles.historyRow}>
            <Text style={styles.historyLabel}>Amount</Text>
            <Text style={styles.historyValue}>{parseFloat(item.amount).toFixed(2)}</Text>
          </View>
        )}

        {parts.length > 0 && (
          <View style={styles.partsSection}>
            <Text style={styles.historyLabel}>Parts Replaced</Text>
            {parts.map((part, index) => (
              <Text key={index} style={styles.partItem}>
                {part.name} x{part.quantity} - {parseFloat(part.cost).toFixed(2)}
              </Text>
            ))}
          </View>
        )}

        {item.notes && (
          <View style={{ marginTop: 6 }}>
            <Text style={styles.historyLabel}>Notes</Text>
            <Text style={styles.historyNotes}>{item.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Past Services</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ marginTop: 40 }}
            />
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="clipboard-text-clock-outline"
                    size={48}
                    color={COLORS.grayBorder}
                  />
                  <Text style={styles.emptyText}>No past services found</Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  modalTitle: { ...FONTS.h3 },
  closeBtn: { padding: 4 },
  historyItem: {
    marginHorizontal: SIZES.padding,
    marginTop: 12,
    padding: 14,
    backgroundColor: COLORS.grayLight,
    borderRadius: SIZES.radius,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDateBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyDate: { ...FONTS.medium, fontSize: 13, marginLeft: 4 },
  historyTypeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  historyType: {
    ...FONTS.small,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  historyLabel: { ...FONTS.small, fontSize: 12, fontWeight: "600", color: COLORS.gray },
  historyValue: { ...FONTS.medium, fontSize: 13 },
  partsSection: { marginTop: 6 },
  partItem: { ...FONTS.regular, fontSize: 13, marginTop: 2, marginLeft: 8 },
  historyNotes: { ...FONTS.regular, fontSize: 13, marginTop: 2, color: COLORS.gray },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { ...FONTS.regular, color: COLORS.gray, marginTop: 12 },
});

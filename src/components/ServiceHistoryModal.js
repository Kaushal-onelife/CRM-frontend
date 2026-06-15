import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { serviceAPI } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { SkeletonCard } from "./ui/Skeleton";

export default function ServiceHistoryModal({ visible, onClose, customerId }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
      setHistory(result.services || []);
    } catch (error) {
      console.error(error.message);
      setHistory([]);
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
            <MaterialCommunityIcons name="calendar" size={14} color={colors.primary} />
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
            <Text style={styles.historyValue}>₹{parseFloat(item.amount).toFixed(2)}</Text>
          </View>
        )}

        {parts.length > 0 && (
          <View style={styles.partsSection}>
            <Text style={styles.historyLabel}>Parts Replaced</Text>
            {parts.map((part, index) => (
              <Text key={index} style={styles.partItem}>
                {part.name} x{part.quantity} - ₹{parseFloat(part.cost).toFixed(2)}
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
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
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
                    color={colors.border}
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

const makeStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "75%",
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    modalTitle: { fontSize: 17, fontWeight: "600", color: colors.text },
    closeBtn: { padding: 4 },
    loadingContainer: { padding: 16 },
    historyItem: {
      marginHorizontal: 16,
      marginTop: 12,
      padding: 14,
      backgroundColor: colors.grayLight,
      borderRadius: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.secondary,
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
    historyDate: { fontSize: 13, fontWeight: "600", color: colors.text, marginLeft: 4 },
    historyTypeBadge: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
    },
    historyType: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    historyRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
    },
    historyLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
    historyValue: { fontSize: 13, fontWeight: "600", color: colors.text },
    partsSection: { marginTop: 6 },
    partItem: { fontSize: 13, color: colors.text, marginTop: 2, marginLeft: 8 },
    historyNotes: { fontSize: 13, marginTop: 2, color: colors.textSecondary },
    emptyContainer: { alignItems: "center", marginTop: 40 },
    emptyText: { color: colors.textSecondary, marginTop: 12 },
  });

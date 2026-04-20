import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { customerAPI, serviceAPI } from "../../services/api";
import ServiceCard from "../../components/ServiceCard";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

export default function CustomerDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [customer, setCustomer] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [cust, svc] = await Promise.all([
        customerAPI.getById(id),
        serviceAPI.getAll(`customer_id=${id}`),
      ]);
      setCustomer(cust);
      setServices(svc.services || []);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [id])
  );

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (customer?.phone) {
      const phone = customer.phone.replace(/\D/g, "");
      const number = phone.startsWith("91") ? phone : `91${phone}`;
      Linking.openURL(`whatsapp://send?phone=${number}`);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${customer.name}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await customerAPI.delete(id);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Customer not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {customer.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.phone}>{customer.phone}</Text>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleWhatsApp}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("AddService", { customerId: id })}
          >
            <Text style={styles.actionIcon}>🔧</Text>
            <Text style={styles.actionLabel}>New Service</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        {[
          { label: "Email", value: customer.email },
          { label: "Address", value: customer.address },
          { label: "City", value: customer.city },
          { label: "Purifier Brand", value: customer.purifier_brand },
          { label: "Purifier Model", value: customer.purifier_model },
          { label: "Installation Date", value: customer.installation_date },
          { label: "Notes", value: customer.notes },
        ]
          .filter((item) => item.value)
          .map((item) => (
            <View key={item.label} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
      </View>

      {/* Service History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Service History ({services.length})
        </Text>
        {services.length === 0 ? (
          <Text style={styles.emptyText}>No services yet</Text>
        ) : (
          services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onPress={() =>
                navigation.navigate("Services", {
                  screen: "ServiceDetail",
                  params: { id: service.id },
                })
              }
            />
          ))
        )}
      </View>

      {/* Edit / Delete */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() =>
            navigation.navigate("EditCustomer", { id, customer })
          }
        >
          <Text style={styles.editBtnText}>Edit Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    ...FONTS.regular,
    color: COLORS.gray,
  },
  header: {
    backgroundColor: COLORS.white,
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
  },
  name: {
    ...FONTS.h2,
  },
  phone: {
    ...FONTS.regular,
    color: COLORS.gray,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    marginTop: 20,
    gap: 24,
  },
  actionBtn: {
    alignItems: "center",
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionLabel: {
    ...FONTS.small,
  },
  card: {
    backgroundColor: COLORS.white,
    margin: SIZES.padding,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    elevation: 1,
  },
  cardTitle: {
    ...FONTS.h3,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  detailLabel: {
    ...FONTS.regular,
    color: COLORS.gray,
    width: 130,
  },
  detailValue: {
    ...FONTS.regular,
    flex: 1,
  },
  section: {
    paddingHorizontal: SIZES.padding,
  },
  sectionTitle: {
    ...FONTS.h3,
    marginBottom: 10,
  },
  emptyText: {
    ...FONTS.regular,
    color: COLORS.gray,
    textAlign: "center",
    paddingVertical: 20,
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: SIZES.padding,
    marginTop: 20,
    gap: 12,
  },
  editBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  editBtnText: {
    color: COLORS.white,
    ...FONTS.bold,
  },
  deleteBtn: {
    backgroundColor: COLORS.danger + "15",
    borderRadius: 8,
    padding: 14,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  deleteBtnText: {
    color: COLORS.danger,
    ...FONTS.bold,
  },
});

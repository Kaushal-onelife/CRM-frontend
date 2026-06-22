import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { customerAPI, serviceAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import ServiceCard from "../../components/ServiceCard";
import { Card, Button, EmptyState, Skeleton, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import { confirm } from "../../utils/confirm";

export default function CustomerDetailScreen({ route, navigation }) {
  const { colors, radius, elevation } = useTheme();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { id } = route.params;
  const [deleting, setDeleting] = useState(false);

  // Cache-first: customer profile shows instantly (incl. offline), then refreshes.
  const {
    data: customer,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerAPI.getById(id),
  });

  // Service history — its own key so it caches/refreshes independently.
  const { data: historyData } = useQuery({
    queryKey: ["customer", id, "services"],
    queryFn: () => serviceAPI.getAll(`customer_id=${id}`),
  });
  const services = historyData?.services || [];

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
    if (deleting) return;
    if (!requireOnline()) return;
    confirm({
      title: "Delete Customer",
      message: `Are you sure you want to delete ${customer.name}? This cannot be undone.`,
      confirmText: "Delete",
      destructive: true,
      onConfirm: async () => {
        setDeleting(true);
        try {
          await customerAPI.delete(id);
          // Refresh the list and dashboard so the deleted customer disappears.
          queryClient.invalidateQueries({ queryKey: ["customers"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          navigation.goBack();
        } catch (error) {
          toast.error(error.message || "Something went wrong");
          setDeleting(false);
        }
      },
    });
  };

  // ── Loading: skeleton blocks instead of a blank spinner ──
  if (isLoading && !customer) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingHorizontal: 16 }]}>
        <View style={{ alignItems: "center", marginTop: 24 }}>
          <Skeleton width={72} height={72} radius={36} />
          <Skeleton width="50%" height={20} style={{ marginTop: 12 }} />
          <Skeleton width="35%" height={14} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width="100%" height={120} radius={16} style={{ marginTop: 24 }} />
        <Skeleton width="100%" height={180} radius={16} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (error && !customer) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}>
        <EmptyState
          tone="error"
          icon="account-off-outline"
          title="Couldn't load customer"
          message={error.message || "This customer may have been removed."}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}>
        <EmptyState
          tone="error"
          icon="account-off-outline"
          title="Customer not found"
          message="This customer may have been removed."
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const actions = [
    { icon: "phone", label: "Call", color: colors.success, onPress: handleCall },
    { icon: "whatsapp", label: "WhatsApp", color: "#25D366", onPress: handleWhatsApp },
    {
      icon: "wrench-outline",
      label: "New Service",
      color: colors.primary,
      onPress: () => navigation.navigate("AddService", { customerId: id }),
    },
    {
      icon: "file-document-outline",
      label: "New AMC",
      color: colors.accent,
      onPress: () =>
        navigation.navigate("More", {
          screen: "CreateAMC",
          params: { customerId: id },
        }),
    },
  ];

  const details = [
    { label: "Email", value: customer.email, icon: "email-outline" },
    { label: "Address", value: customer.address, icon: "map-marker-outline" },
    { label: "City", value: customer.city, icon: "city-variant-outline" },
    { label: "Purifier Brand", value: customer.purifier_brand, icon: "water-outline" },
    { label: "Purifier Model", value: customer.purifier_model, icon: "cog-outline" },
    { label: "Installation Date", value: customer.installation_date, icon: "calendar-outline" },
    { label: "Notes", value: customer.notes, icon: "note-text-outline" },
  ].filter((item) => item.value);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <Animated.View
        entering={FadeInDown.duration(350)}
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {customer.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{customer.name}</Text>
        <Text style={[styles.phone, { color: colors.textSecondary }]}>{customer.phone}</Text>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {actions.map((a) => (
            <Pressable key={a.label} style={styles.actionBtn} onPress={a.onPress}>
              <View style={[styles.actionIconWrap, { backgroundColor: `${a.color}1A` }]}>
                <MaterialCommunityIcons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      <View style={{ paddingHorizontal: 16 }}>
        {/* Details Card */}
        <Animated.View entering={FadeInDown.delay(80).duration(350)} style={{ marginTop: 16 }}>
          <Card>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Details</Text>
            {details.length === 0 ? (
              <Text style={{ color: colors.textMuted, paddingVertical: 8 }}>
                No additional details
              </Text>
            ) : (
              details.map((item, i) => (
                <View
                  key={item.label}
                  style={[
                    styles.detailRow,
                    {
                      borderBottomColor: colors.divider,
                      borderBottomWidth: i === details.length - 1 ? 0 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={18}
                    color={colors.textMuted}
                    style={{ marginRight: 10, marginTop: 1 }}
                  />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {item.value}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </Animated.View>

        {/* Service History */}
        <Animated.View entering={FadeInDown.delay(140).duration(350)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Service History ({services.length})
          </Text>
          {services.length === 0 ? (
            <Card>
              <Text style={{ color: colors.textSecondary, textAlign: "center", paddingVertical: 12 }}>
                No services yet
              </Text>
            </Card>
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
        </Animated.View>

        {/* Edit / Delete */}
        <View style={styles.bottomActions}>
          <View style={{ flex: 1 }}>
            <Button
              title="Edit Customer"
              icon="pencil-outline"
              disabled={deleting}
              onPress={() => navigation.navigate("EditCustomer", { id, customer })}
            />
          </View>
          <View style={{ width: 120 }}>
            <Button
              title="Delete"
              variant="danger"
              icon="trash-can-outline"
              loading={deleting}
              disabled={deleting}
              onPress={handleDelete}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
  },
  phone: {
    fontSize: 15,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    marginTop: 20,
    gap: 20,
  },
  actionBtn: {
    alignItems: "center",
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  bottomActions: {
    flexDirection: "row",
    marginTop: 20,
    gap: 12,
  },
});

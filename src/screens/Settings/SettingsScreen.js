import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { supabase } from "../../services/supabase";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

export default function SettingsScreen() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { data } = await supabase
        .from("users")
        .select("*, tenants(*)")
        .eq("id", authUser.id)
        .single();
      setUser(data);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || "Loading..."}</Text>
        <Text style={styles.role}>{user?.role || ""}</Text>
      </View>

      {/* Business Info */}
      {user?.tenants && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Business Info</Text>
          {[
            { label: "Business Name", value: user.tenants.business_name },
            { label: "Owner", value: user.tenants.owner_name },
            { label: "Phone", value: user.tenants.phone },
            { label: "Email", value: user.tenants.email },
            { label: "Address", value: user.tenants.address },
            {
              label: "Subscription",
              value: user.tenants.subscription_status,
            },
          ]
            .filter((item) => item.value)
            .map((item) => (
              <View key={item.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
        </View>
      )}

      {/* Menu Items */}
      <View style={styles.card}>
        {[
          { label: "About", subtitle: "Water Purifier CRM v1.0.0" },
          { label: "Help & Support", subtitle: "Get help with the app" },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={styles.menuItem}>
            <View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileCard: {
    backgroundColor: COLORS.white,
    alignItems: "center",
    paddingVertical: 30,
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
  avatarText: { fontSize: 28, fontWeight: "700", color: COLORS.primary },
  name: { ...FONTS.h2 },
  role: { ...FONTS.regular, color: COLORS.gray, marginTop: 4, textTransform: "capitalize" },
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
  detailLabel: { ...FONTS.regular, color: COLORS.gray, width: 120 },
  detailValue: { ...FONTS.regular, flex: 1, textTransform: "capitalize" },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  menuLabel: { ...FONTS.medium },
  menuSubtitle: { ...FONTS.small, marginTop: 2 },
  arrow: { fontSize: 22, color: COLORS.gray },
  logoutBtn: {
    margin: SIZES.padding,
    backgroundColor: COLORS.danger + "10",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  logoutText: { color: COLORS.danger, ...FONTS.bold },
});

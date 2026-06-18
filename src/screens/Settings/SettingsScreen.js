import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useTheme } from "../../context/ThemeContext";
import { Button, Card } from "../../components/ui";
import { confirm } from "../../utils/confirm";
import { pickAvatar, uploadAvatar } from "../../utils/avatar";

export default function SettingsScreen({ navigation }) {
  const { colors, theme, isDark, toggleTheme, elevation } = useTheme();
  const [user, setUser] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data, error } = await supabase
          .from("users")
          .select("*, tenants(*)")
          .eq("id", authUser.id)
          .single();
        if (error) throw error;
        setUser(data);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load profile");
    }
  };

  const handleChangeAvatar = async () => {
    try {
      const picked = await pickAvatar();
      if (!picked) return; // cancelled
      if (!user?.id) return;

      setUploadingAvatar(true);
      const url = await uploadAvatar(user.id, picked.base64, picked.mime);

      // Save the URL on the user row.
      const { error } = await supabase
        .from("users")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (error) throw new Error(error.message);

      setUser((prev) => ({ ...prev, avatar_url: url }));
    } catch (e) {
      Alert.alert("Couldn't update photo", e.message || "Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    confirm({
      title: "Logout",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      destructive: true,
      onConfirm: async () => {
        // Local scope clears the stored session immediately without a network
        // round-trip; onAuthStateChange then fires SIGNED_OUT -> navigates to Login.
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch (e) {
          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        }
      },
    });
  };

  const menuItems = [
    {
      label: "Parts Inventory",
      subtitle: "Manage stock of filters and parts",
      icon: "package-variant-closed",
      onPress: () => navigation.navigate("Inventory"),
    },
    {
      label: "About",
      subtitle: "ClientTrack v1.0.0",
      icon: "information-outline",
      onPress: () =>
        Alert.alert(
          "About",
          "ClientTrack\nVersion 1.0.0\n\nA simple CRM to manage customers, services and bills."
        ),
    },
    {
      label: "Help & Support",
      subtitle: "Get help with the app",
      icon: "lifebuoy",
      onPress: () =>
        Alert.alert(
          "Help & Support",
          "For assistance, please contact:\n\nEmail: support@onelifecapital.in"
        ),
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile */}
      <View style={styles.profileWrap}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleChangeAvatar}
          disabled={uploadingAvatar || !user}
          style={styles.avatarWrap}
        >
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={[styles.avatar, { backgroundColor: colors.primaryLight }]}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
          )}

          {/* Loading overlay while uploading */}
          {uploadingAvatar && (
            <View style={[styles.avatar, styles.avatarOverlay]}>
              <ActivityIndicator color="#fff" />
            </View>
          )}

          {/* Camera badge cue */}
          <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <MaterialCommunityIcons name="camera" size={14} color={colors.onPrimary} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.name, { color: colors.text }]}>
          {user?.name || "Loading..."}
        </Text>
        <Text style={[styles.role, { color: colors.textSecondary }]}>
          {user?.role || ""}
        </Text>
      </View>

      {/* Business Info */}
      {user?.tenants && (
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Business Info</Text>
          {[
            { label: "Business Name", value: user.tenants.business_name },
            { label: "Owner", value: user.tenants.owner_name },
            { label: "Phone", value: user.tenants.phone },
            { label: "Email", value: user.tenants.email },
            { label: "Address", value: user.tenants.address },
            { label: "Subscription", value: user.tenants.subscription_status },
          ]
            .filter((item) => item.value)
            .map((item) => (
              <View
                key={item.label}
                style={[styles.detailRow, { borderBottomColor: colors.divider }]}
              >
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  {item.label}
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {item.value}
                </Text>
              </View>
            ))}
        </Card>
      )}

      {/* Preferences */}
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Preferences</Text>
        <View style={styles.toggleRow}>
          <View style={styles.menuLeft}>
            <View
              style={[styles.menuIcon, { backgroundColor: colors.primarySoft }]}
            >
              <MaterialCommunityIcons
                name={isDark ? "weather-night" : "white-balance-sunny"}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuLabel, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                {isDark ? "On" : "Off"}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.border}
          />
        </View>
      </Card>

      {/* Menu */}
      <Card style={styles.card}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.menuItem,
              idx < menuItems.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.divider,
              },
            ]}
            onPress={item.onPress}
          >
            <View style={styles.menuLeft}>
              <View
                style={[styles.menuIcon, { backgroundColor: colors.primarySoft }]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ))}
      </Card>

      {/* Logout */}
      <View style={styles.logoutWrap}>
        <Button
          title="Logout"
          variant="danger"
          icon="logout"
          onPress={handleLogout}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileWrap: {
    alignItems: "center",
    paddingVertical: 30,
  },
  avatarWrap: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarText: { fontSize: 30, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", letterSpacing: -0.2 },
  role: {
    fontSize: 15,
    marginTop: 4,
    textTransform: "capitalize",
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 17, fontWeight: "600", marginBottom: 8 },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: { fontSize: 14, width: 120 },
  detailValue: { fontSize: 14, flex: 1, textTransform: "capitalize" },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: { fontSize: 15, fontWeight: "600" },
  menuSubtitle: { fontSize: 12, marginTop: 2 },
  logoutWrap: {
    marginHorizontal: 16,
    marginTop: 4,
  },
});

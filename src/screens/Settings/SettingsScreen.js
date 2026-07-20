import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useTheme } from "../../context/ThemeContext";
import { Button, Card, Input, useToast, alert } from "../../components/ui";
import { confirm } from "../../utils/confirm";
import { pickAvatar, uploadAvatar } from "../../utils/avatar";
import { useProfile } from "../../hooks/useProfile";
import { tenantAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import NotificationPrefs from "../../components/NotificationPrefs";

export default function SettingsScreen({ navigation }) {
  const { colors, theme, isDark, toggleTheme, elevation } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  // Cached profile (shared ["profile"] query) — opens instantly from cache,
  // works offline, refreshes in the background. No load-then-flash.
  const { data: user } = useProfile();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Edit business info (incl. bill terms). Form opens prefilled from the tenant.
  const [editingBiz, setEditingBiz] = useState(false);
  const [savingBiz, setSavingBiz] = useState(false);
  const [bizForm, setBizForm] = useState({});

  // Terms & conditions live in their own card with their own edit state, so
  // editing them doesn't require opening the Business Info form.
  const [editingTerms, setEditingTerms] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);
  const [termsForm, setTermsForm] = useState({});

  const startEditBiz = () => {
    const t = user?.tenants || {};
    setBizForm({
      business_name: t.business_name || "",
      owner_name: t.owner_name || "",
      email: t.email || "",
      address: t.address || "",
    });
    setEditingBiz(true);
  };

  const setBiz = (key) => (v) => setBizForm((f) => ({ ...f, [key]: v }));

  const startEditTerms = () => {
    const t = user?.tenants || {};
    setTermsForm({ bill_terms: t.bill_terms || "", amc_terms: t.amc_terms || "" });
    setEditingTerms(true);
  };

  const setTerms = (key) => (v) => setTermsForm((f) => ({ ...f, [key]: v }));

  const handleSaveTerms = async () => {
    if (!requireOnline()) return;
    if (!user?.tenant_id) return;
    setSavingTerms(true);
    try {
      await tenantAPI.update(user.tenant_id, {
        bill_terms: termsForm.bill_terms.trim() || null,
        amc_terms: termsForm.amc_terms.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditingTerms(false);
      toast.success("Terms updated");
    } catch (error) {
      toast.error(error.message || "Couldn't save. Please try again.");
    }
    setSavingTerms(false);
  };

  const handleSaveBiz = async () => {
    if (!requireOnline()) return;
    if (!bizForm.business_name?.trim()) {
      toast.error("Business name can't be empty.");
      return;
    }
    if (!user?.tenant_id) return;
    setSavingBiz(true);
    try {
      await tenantAPI.update(user.tenant_id, {
        business_name: bizForm.business_name.trim(),
        owner_name: bizForm.owner_name.trim(),
        email: bizForm.email.trim() || null,
        address: bizForm.address.trim() || null,
      });
      // Refresh the shared profile so Settings + bill PDFs see the new values.
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditingBiz(false);
      toast.success("Business info updated");
    } catch (error) {
      toast.error(error.message || "Couldn't save. Please try again.");
    }
    setSavingBiz(false);
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

      // Update the cached profile so the new avatar shows everywhere instantly
      // (Settings + Dashboard header share the ["profile"] cache).
      queryClient.setQueryData(["profile"], (prev) =>
        prev ? { ...prev, avatar_url: url } : prev
      );
    } catch (e) {
      toast.error(e.message || "Couldn't update photo");
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
      // Branded info dialog (not a toast) — content the user reads.
      onPress: () =>
        alert.show({
          title: "About",
          message: "ClientTrack\nVersion 1.0.0\n\nA simple CRM to manage customers, services and bills.",
        }),
    },
    {
      label: "Help & Support",
      subtitle: "Get help with the app",
      icon: "lifebuoy",
      onPress: () =>
        alert.show({
          title: "Help & Support",
          message: "For assistance, please contact:\n\nEmail: kaushalpc2157@gmail.com\nPhone: +91 9172772157",
        }),
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
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
              Business Info
            </Text>
            {!editingBiz && (
              <TouchableOpacity onPress={startEditBiz} hitSlop={8} style={styles.editLink}>
                <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {!editingBiz ? (
            // Read-only view
            [
              { label: "Business Name", value: user.tenants.business_name },
              { label: "Owner", value: user.tenants.owner_name },
              { label: "Phone", value: user.tenants.phone },
              { label: "Email", value: user.tenants.email },
              { label: "Address", value: user.tenants.address },
              { label: "Subscription", value: user.tenants.subscription_status },
              {
                label: "Member Since",
                value: user.tenants.created_at
                  ? new Date(user.tenants.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : null,
              },
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
                  <Text
                    style={[styles.detailValue, { color: colors.text }]}
                    numberOfLines={3}
                  >
                    {item.value}
                  </Text>
                </View>
              ))
          ) : (
            // Edit form
            <View style={{ marginTop: 8 }}>
              <Input
                label="Business Name"
                value={bizForm.business_name}
                onChangeText={setBiz("business_name")}
                placeholder="Your business name"
              />
              <Input
                label="Owner Name"
                value={bizForm.owner_name}
                onChangeText={setBiz("owner_name")}
                placeholder="Owner name"
              />
              <Input
                label="Email"
                value={bizForm.email}
                onChangeText={setBiz("email")}
                placeholder="business@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Address"
                value={bizForm.address}
                onChangeText={setBiz("address")}
                placeholder="Business address (shown on bills)"
                multiline
              />
              <View style={styles.editActions}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setEditingBiz(false)}
                  disabled={savingBiz}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save"
                  icon="content-save-outline"
                  onPress={handleSaveBiz}
                  loading={savingBiz}
                  disabled={savingBiz}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </Card>
      )}

      {/* Terms & Conditions — printed on bills, so edited independently of business info */}
      {user?.tenants && (
        <Card style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>
              Terms & Conditions
            </Text>
            {!editingTerms && (
              <TouchableOpacity onPress={startEditTerms} hitSlop={8} style={styles.editLink}>
                <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {!editingTerms ? (
            <>
              <View style={[styles.detailRow, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Bill Terms
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: user.tenants.bill_terms ? colors.text : colors.textMuted },
                  ]}
                  numberOfLines={3}
                >
                  {user.tenants.bill_terms || "Not set"}
                </Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: colors.divider }]}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  AMC Terms
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: user.tenants.amc_terms ? colors.text : colors.textMuted },
                  ]}
                  numberOfLines={3}
                >
                  {user.tenants.amc_terms || "Not set"}
                </Text>
              </View>
            </>
          ) : (
            <View style={{ marginTop: 8 }}>
              <Input
                label="Bill Terms & Conditions"
                value={termsForm.bill_terms}
                onChangeText={setTerms("bill_terms")}
                placeholder="e.g. Replaced parts carry a 3-month warranty. Payment due within 7 days."
                multiline
              />
              <Text style={[styles.fieldHint, { color: colors.textMuted }]}>
                Printed at the bottom of regular service/parts bills.
              </Text>
              <Input
                label="AMC Terms & Conditions"
                value={termsForm.amc_terms}
                onChangeText={setTerms("amc_terms")}
                placeholder="e.g. Covers scheduled services only. Spare parts charged separately. Non-refundable."
                multiline
              />
              <Text style={[styles.fieldHint, { color: colors.textMuted }]}>
                Printed on AMC contract bills. Leave terms blank to hide them.
              </Text>

              <View style={styles.editActions}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setEditingTerms(false)}
                  disabled={savingTerms}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save"
                  icon="content-save-outline"
                  onPress={handleSaveTerms}
                  loading={savingTerms}
                  disabled={savingTerms}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
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

      {/* Notification preferences (per-category push toggles) */}
      <NotificationPrefs />

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
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  editLink: { flexDirection: "row", alignItems: "center", gap: 4 },
  fieldHint: { fontSize: 11, marginTop: -4, marginBottom: 4, lineHeight: 15 },
  editActions: { flexDirection: "row", gap: 12, marginTop: 8 },
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

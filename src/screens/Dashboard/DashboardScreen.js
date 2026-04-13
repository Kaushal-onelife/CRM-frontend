import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { dashboardAPI } from "../../services/api";
import StatCard from "../../components/StatCard";
import ServiceCard from "../../components/ServiceCard";
import { useTheme } from "../../context/ThemeContext";

const BOTTOM_PADDING = 90; // gives clearance above tab bar

export default function DashboardScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const result = await dashboardAPI.get();
      setData(result);
    } catch (error) {
      console.error("Dashboard error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const stats = data?.stats || {};
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchDashboard(); }}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* ── Page Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 2 }}>
          {greeting} 👋
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text, letterSpacing: -0.5 }}>
            Dashboard
          </Text>
          <TouchableOpacity
            style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: isDark ? colors.card : "#F1F5F9",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Grid ── */}
      <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          <StatCard title="Customers"       value={stats.total_customers    || 0}          color="#2563EB" icon="account-group"        />
          <StatCard title="Pending"         value={stats.pending_services   || 0}          color="#F59E0B" icon="timer-sand"            />
          <StatCard title="Done / Month"    value={stats.completed_this_month || 0}        color="#10B981" icon="check-circle-outline"  />
          <StatCard title="Overdue"         value={stats.overdue_count      || 0}          color="#EF4444" icon="alert-circle-outline"  />
          <StatCard title="Revenue / Month" value={`₹${stats.monthly_revenue || 0}`}      color="#10B981" icon="currency-inr"          />
          <StatCard title="Unpaid Bills"    value={`₹${stats.total_unpaid  || 0}`}        color="#EF4444" icon="file-document-outline" />
        </View>
      </View>

      {/* ── Today's Services ── */}
      <SectionHeader title="Today's Services" icon="calendar-today" color={colors.primary} colors={colors} />
      <View style={{ paddingHorizontal: 20 }}>
        {(data?.today_services || []).length === 0
          ? <EmptyState icon="calendar-blank" label="Nothing scheduled for today" colors={colors} isDark={isDark} />
          : data.today_services.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                onPress={() => navigation.navigate("Services", { screen: "ServiceDetail", params: { id: s.id } })}
              />
            ))}
      </View>

      {/* ── Upcoming ── */}
      <SectionHeader title="Upcoming — 7 days" icon="calendar-clock" color="#8B5CF6" colors={colors} />
      <View style={{ paddingHorizontal: 20 }}>
        {(data?.upcoming_services || []).length === 0
          ? <EmptyState icon="calendar-clock-outline" label="No upcoming services" colors={colors} isDark={isDark} />
          : data.upcoming_services.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                onPress={() => navigation.navigate("Services", { screen: "ServiceDetail", params: { id: s.id } })}
              />
            ))}
      </View>

      {/* ── Overdue ── */}
      {(data?.overdue_services || []).length > 0 && (
        <>
          <SectionHeader title="Overdue" icon="alert-decagram" color="#EF4444" colors={colors} />
          <View style={{ paddingHorizontal: 20 }}>
            {data.overdue_services.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                onPress={() => navigation.navigate("Services", { screen: "ServiceDetail", params: { id: s.id } })}
              />
            ))}
          </View>
        </>
      )}

      <View style={{ height: BOTTOM_PADDING }} />
    </ScrollView>
  );
}

function SectionHeader({ title, icon, color, colors }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginTop: 24, marginBottom: 14 }}>
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: `${color}18`, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
        <MaterialCommunityIcons name={icon} size={17} color={color} />
      </View>
      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, letterSpacing: -0.2 }}>
        {title}
      </Text>
    </View>
  );
}

function EmptyState({ icon, label, colors, isDark }) {
  return (
    <View style={{
      paddingVertical: 32, alignItems: "center", borderRadius: 16,
      borderWidth: 1.5, borderStyle: "dashed",
      borderColor: isDark ? "#2D2D44" : "#E2E8F0",
      backgroundColor: isDark ? "#1A1A2E" : "#FAFBFF",
    }}>
      <MaterialCommunityIcons name={icon} size={32} color={isDark ? "#4B5563" : "#CBD5E1"} />
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 10, fontWeight: "500" }}>
        {label}
      </Text>
    </View>
  );
}

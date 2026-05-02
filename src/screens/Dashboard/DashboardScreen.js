import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { dashboardAPI } from "../../services/api";
import StatCard from "../../components/StatCard";
import ServiceCard from "../../components/ServiceCard";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

const formatMoney = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : "₹0";
};

const formatCount = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? String(num) : "0";
};

export default function DashboardScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      const result = await dashboardAPI.get();
      setData(result);
      setError(null);
    } catch (err) {
      console.error("Dashboard error:", err.message);
      setError(err.message || "Failed to load dashboard");
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Couldn't load dashboard</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setLoading(true);
            fetchDashboard();
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = data?.stats || {};

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchDashboard();
          }}
        />
      }
    >
      <Text style={styles.greeting}>Dashboard</Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Customers"
          value={formatCount(stats.total_customers)}
          color={COLORS.primary}
        />
        <StatCard
          title="Pending Services"
          value={formatCount(stats.pending_services)}
          color={COLORS.warning}
        />
        <StatCard
          title="Completed (Month)"
          value={formatCount(stats.completed_this_month)}
          color={COLORS.secondary}
        />
        <StatCard
          title="Due"
          value={formatCount(stats.due_count)}
          color="#F97316"
        />
        <StatCard
          title="Follow Up"
          value={formatCount(stats.followup_services)}
          color="#8B5CF6"
        />
        <StatCard
          title="Revenue (Month)"
          value={formatMoney(stats.monthly_revenue)}
          color={COLORS.secondary}
        />
        <StatCard
          title="Unpaid Bills"
          value={formatMoney(stats.total_unpaid)}
          color={COLORS.danger}
        />
      </View>

      {/* Today's Services */}
      <Text style={styles.sectionTitle}>Today's Services</Text>
      {(data?.today_services || []).length === 0 ? (
        <Text style={styles.emptyText}>No services scheduled for today</Text>
      ) : (
        data.today_services.map((service) => (
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

      {/* Upcoming Services */}
      <Text style={styles.sectionTitle}>Upcoming (7 days)</Text>
      {(data?.upcoming_services || []).length === 0 ? (
        <Text style={styles.emptyText}>No upcoming services</Text>
      ) : (
        data.upcoming_services.map((service) => (
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

      {/* Due Services */}
      {(data?.due_services || []).length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: "#F97316" }]}>
            Due Services
          </Text>
          {data.due_services.map((service) => (
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
          ))}
        </>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  greeting: {
    ...FONTS.h1,
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    ...FONTS.h3,
    marginTop: 16,
    marginBottom: 10,
  },
  emptyText: {
    ...FONTS.regular,
    color: COLORS.gray,
    textAlign: "center",
    paddingVertical: 20,
  },
  errorTitle: {
    ...FONTS.h3,
    color: COLORS.danger,
    marginBottom: 8,
  },
  errorMsg: {
    ...FONTS.regular,
    color: COLORS.gray,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: { color: COLORS.white, ...FONTS.bold },
});

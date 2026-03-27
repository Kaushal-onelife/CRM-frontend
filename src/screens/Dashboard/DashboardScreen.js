import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { dashboardAPI } from "../../services/api";
import StatCard from "../../components/StatCard";
import ServiceCard from "../../components/ServiceCard";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

export default function DashboardScreen({ navigation }) {
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
          value={stats.total_customers}
          color={COLORS.primary}
        />
        <StatCard
          title="Pending Services"
          value={stats.pending_services}
          color={COLORS.warning}
        />
        <StatCard
          title="Completed (Month)"
          value={stats.completed_this_month}
          color={COLORS.secondary}
        />
        <StatCard
          title="Overdue"
          value={stats.overdue_count}
          color={COLORS.danger}
        />
        <StatCard
          title="Revenue (Month)"
          value={`₹${stats.monthly_revenue}`}
          color={COLORS.secondary}
        />
        <StatCard
          title="Unpaid Bills"
          value={`₹${stats.total_unpaid}`}
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

      {/* Overdue */}
      {(data?.overdue_services || []).length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>
            Overdue Services
          </Text>
          {data.overdue_services.map((service) => (
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
});

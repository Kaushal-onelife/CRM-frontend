import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
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
      Alert.alert("Error", "Failed to load dashboard. Pull down to retry.");
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

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Customers"
          value={stats.total_customers || 0}
          color={COLORS.primary}
        />
        <StatCard
          title="Pending Services"
          value={stats.pending_services || 0}
          color={COLORS.warning}
        />
        <StatCard
          title="Completed (Month)"
          value={stats.completed_this_month || 0}
          color={COLORS.secondary}
        />
        <StatCard
          title="Overdue"
          value={stats.overdue_count || 0}
          color={COLORS.danger}
        />
        <StatCard
          title="Revenue (Month)"
          value={`Rs ${stats.monthly_revenue || 0}`}
          color={COLORS.secondary}
        />
        <StatCard
          title="Unpaid Bills"
          value={`Rs ${stats.total_unpaid || 0}`}
          color={COLORS.danger}
        />
        <StatCard
          title="Active AMCs"
          value={stats.active_amc || 0}
          color={COLORS.primary}
        />
        <StatCard
          title="AMC Expiring Soon"
          value={stats.expiring_amc || 0}
          color={COLORS.warning}
        />
      </View>

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

      {(data?.expiring_amc_contracts || []).length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: COLORS.warning }]}>
            AMC Expiring Soon
          </Text>
          {data.expiring_amc_contracts.map((contract) => (
            <TouchableOpacity
              key={contract.id}
              style={styles.amcCard}
              onPress={() =>
                navigation.navigate("AMC", {
                  screen: "AMCDetail",
                  params: { id: contract.id },
                })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.amcCustomer}>{contract.customers?.name}</Text>
                <Text style={styles.amcPlan}>{contract.plan_name}</Text>
              </View>
              <Text style={styles.amcExpiry}>
                Expires {contract.end_date}
              </Text>
            </TouchableOpacity>
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
  amcCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: 8,
    elevation: 1,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  amcCustomer: { ...FONTS.bold, fontSize: 14 },
  amcPlan: { ...FONTS.small, color: COLORS.gray, marginTop: 2 },
  amcExpiry: { ...FONTS.small, color: COLORS.warning, fontWeight: "600" },
});

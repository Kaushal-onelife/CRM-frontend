import React from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { dashboardAPI, reminderAPI } from "../../services/api";
import ServiceCard from "../../components/ServiceCard";
import { Card, Badge, EmptyState, SkeletonList, Skeleton } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

const formatMoney = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : "₹0";
};
const formatCount = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? String(num) : "0";
};

// Small stat tile — colored icon chip + value + label. Replaces the old StatCard.
function Stat({ icon, label, value, color, index }) {
  const { colors, radius, elevation } = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 60).duration(350)}
      style={{ width: "47%" }}
    >
      <View
        style={[
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: 14,
            marginBottom: 12,
          },
          elevation("sm"),
        ]}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: `${color}1A`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <MaterialCommunityIcons name={icon} size={20} color={color} />
        </View>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>{value}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{label}</Text>
      </View>
    </Animated.View>
  );
}

function Section({ title, color, children }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{ color: color || colors.text, fontSize: 17, fontWeight: "700", marginBottom: 10 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { colors, isDark, elevation } = useTheme();

  // Cache-first: persisted data shows instantly (incl. offline), then refreshes.
  const {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardAPI.get(),
  });

  // Reminder count — shares the ["reminders"] cache with the Reminders screen.
  const { data: reminders } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => reminderAPI.get(),
  });
  const reminderCount = reminders?.counts?.total || 0;

  const goToService = (service) =>
    navigation.navigate("Services", { screen: "ServiceDetail", params: { id: service.id } });

  // ── Loading: skeletons only when there's no cached data yet ──
  if (isLoading && !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Skeleton width="55%" height={26} style={{ marginTop: 8, marginBottom: 20 }} />
        <Skeleton width="100%" height={110} radius={16} style={{ marginBottom: 20 }} />
        <SkeletonList count={4} />
      </View>
    );
  }

  // Only show the error screen when we have NO cached data to fall back on.
  if (error && !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}>
        <EmptyState
          tone="error"
          icon="cloud-off-outline"
          title="Couldn't load dashboard"
          message={error.message || "Failed to load dashboard"}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  const stats = data?.stats || {};
  const today = data?.today_services || [];
  const upcoming = data?.upcoming_services || [];
  const due = data?.due_services || [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          tintColor={colors.primary}
          onRefresh={() => refetch()}
        />
      }
    >
      {/* Friendly greeting */}
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8 }}>
          Welcome back 👋
        </Text>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>
          Dashboard
        </Text>
      </Animated.View>

      {/* Hero: revenue this month */}
      <Animated.View entering={FadeInDown.delay(60).duration(400)} style={{ marginTop: 16 }}>
        <View
          style={[
            {
              borderRadius: 18,
              padding: 18,
              backgroundColor: colors.primary,
              overflow: "hidden",
            },
            elevation("lg"),
          ]}
        >
          <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "500" }}>
            Revenue this month
          </Text>
          <Text style={{ color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 4 }}>
            {formatMoney(stats.monthly_revenue)}
          </Text>
          <View style={{ flexDirection: "row", marginTop: 12, alignItems: "center" }}>
            <Badge
              label={`${formatCount(stats.completed_this_month)} completed`}
              color="#fff"
              icon="check-circle-outline"
              size="sm"
            />
            <View style={{ width: 8 }} />
            <Badge
              label={`${formatMoney(stats.total_unpaid)} unpaid`}
              color="#fff"
              icon="alert-circle-outline"
              size="sm"
            />
          </View>
        </View>
      </Animated.View>

      {/* Reminders alert — only when something needs outreach */}
      {reminderCount > 0 && (
        <Animated.View entering={FadeInDown.delay(90).duration(400)} style={{ marginTop: 12 }}>
          <Card
            onPress={() => navigation.navigate("More", { screen: "Reminders" })}
            haptic
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.warningSoft }}
          >
            <MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.warning} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
                {reminderCount} customer{reminderCount === 1 ? "" : "s"} need a reminder
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 1 }}>
                Service due, overdue, or AMC expiring
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Card>
        </Animated.View>
      )}

      {/* Stat grid */}
      <View style={styles.grid}>
        <Stat index={0} icon="account-group" label="Customers" value={formatCount(stats.total_customers)} color={colors.primary} />
        <Stat index={1} icon="timer-sand" label="Pending" value={formatCount(stats.pending_services)} color={colors.warning} />
        <Stat index={2} icon="alert-clock" label="Due" value={formatCount(stats.due_count)} color="#F97316" />
        <Stat index={3} icon="phone-return-outline" label="Follow Up" value={formatCount(stats.followup_services)} color={colors.accent} />
      </View>

      {/* Today */}
      <Section title="Today's Services">
        {today.length === 0 ? (
          <Card><Text style={{ color: colors.textSecondary, textAlign: "center", paddingVertical: 12 }}>Nothing scheduled today 🎉</Text></Card>
        ) : (
          today.map((s, i) => (
            <Animated.View key={s.id} entering={FadeInDown.delay(i * 50).duration(300)}>
              <ServiceCard service={s} onPress={goToService} />
            </Animated.View>
          ))
        )}
      </Section>

      {/* Upcoming */}
      <Section title="Upcoming (7 days)">
        {upcoming.length === 0 ? (
          <Card><Text style={{ color: colors.textSecondary, textAlign: "center", paddingVertical: 12 }}>No upcoming services</Text></Card>
        ) : (
          upcoming.map((s) => <ServiceCard key={s.id} service={s} onPress={goToService} />)
        )}
      </Section>

      {/* Due */}
      {due.length > 0 && (
        <Section title="Due Services" color="#F97316">
          {due.map((s) => <ServiceCard key={s.id} service={s} onPress={goToService} />)}
        </Section>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
});

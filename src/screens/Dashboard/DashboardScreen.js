import React from "react";
import { View, Text, ScrollView, StyleSheet, RefreshControl, Pressable } from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { dashboardAPI } from "../../services/api";
import { useProfile } from "../../hooks/useProfile";
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

// Time-aware greeting for a friendlier, more personal dashboard.
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// Small stat tile — colored icon chip + value + label. Tappable when given onPress.
function Stat({ icon, label, value, color, index, onPress }) {
  const { colors, radius, elevation } = useTheme();
  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 60).duration(350)}
      style={{ width: "47%" }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            padding: 14,
            marginBottom: 12,
            opacity: pressed ? 0.85 : 1,
          },
          // Same shadow token as Card / ServiceCard so all boxes read alike.
          elevation("md"),
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
      </Pressable>
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

  // User profile for the personalized greeting (shared ["profile"] cache).
  const { data: profile } = useProfile();

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
      {/* Friendly, time-aware greeting — personalized with the user's name */}
      <Animated.View entering={FadeIn.duration(300)}>
        <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8 }}>
          {greeting()} 👋
        </Text>
        <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 }}>
          {profile?.name || "Welcome"}
        </Text>
      </Animated.View>

      {/* Hero: revenue this month — brand navy→blue gradient (matches logo) */}
      <Animated.View entering={FadeInDown.delay(60).duration(400)} style={{ marginTop: 16 }}>
        <LinearGradient
          colors={[colors.brandNavy, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[{ borderRadius: 18, padding: 18, overflow: "hidden" }, elevation("lg")]}
        >
          {/* Subtle decorative circle for depth */}
          <View
            style={{
              position: "absolute",
              top: -40,
              right: -30,
              width: 130,
              height: 130,
              borderRadius: 65,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons name="trending-up" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "500", marginLeft: 6 }}>
              Revenue this month
            </Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 34, fontWeight: "800", marginTop: 4 }}>
            {formatMoney(stats.monthly_revenue)}
          </Text>
          <View style={{ flexDirection: "row", marginTop: 14, alignItems: "center" }}>
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
        </LinearGradient>
      </Animated.View>

      {/* Stat grid */}
      <View style={styles.grid}>
        <Stat
          index={0}
          icon="account-group"
          label="Customers"
          value={formatCount(stats.total_customers)}
          color={colors.primary}
          onPress={() => navigation.navigate("Customers", { screen: "CustomerList" })}
        />
        <Stat
          index={1}
          icon="timer-sand"
          label="Pending"
          value={formatCount(stats.pending_services)}
          color={colors.warning}
          onPress={() => navigation.navigate("Services", { screen: "ServiceList", params: { filter: "pending" } })}
        />
        <Stat
          index={2}
          icon="alert-clock"
          label="Due"
          value={formatCount(stats.due_count)}
          color="#F97316"
          onPress={() => navigation.navigate("Services", { screen: "ServiceList", params: { filter: "due" } })}
        />
        <Stat
          index={3}
          icon="phone-return-outline"
          label="Follow Up"
          value={formatCount(stats.followup_services)}
          color={colors.accent}
          onPress={() => navigation.navigate("Services", { screen: "ServiceList", params: { filter: "followup" } })}
        />
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

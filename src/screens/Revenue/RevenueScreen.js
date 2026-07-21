import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { dashboardAPI } from "../../services/api";
import { Card, Button, EmptyState, Skeleton } from "../../components/ui";
import MonthPicker from "../../components/MonthPicker";
import { useProfile } from "../../hooks/useProfile";
import { useTheme } from "../../context/ThemeContext";
import { tint as withAlpha } from "../../utils/color";

const MONTHS_WINDOW = 6;

// Current month as "YYYY-MM" (the default window anchor / picker max).
const currentMonthKey = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};
const currentYear = () => new Date().getUTCFullYear();
const CHART_HEIGHT = 160; // px available for the tallest column

// "collected" = cash actually received (paid bills). "billed" = everything
// invoiced (accrual). The toggle switches which basis the chart + header show;
// outstanding (dues) is always shown alongside since it's the gap between them.
const BASES = [
  { key: "collected", label: "Collected", hint: "Cash received" },
  { key: "billed", label: "Billed", hint: "Total invoiced" },
];

const formatMoney = (n) => {
  const num = Number(n);
  return Number.isFinite(num) ? `₹${num.toLocaleString("en-IN")}` : "₹0";
};

// Compact axis/labels: 12500 -> "12.5k", 1500000 -> "15L".
const formatShort = (n) => {
  const num = Number(n) || 0;
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(Math.round(num));
};

// "2026-07" -> "Jul 2026"
const monthLabel = (key) => {
  const [y, m] = key.split("-");
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
};

// "2026-07" -> "Jul" (compact axis tick)
const monthTick = (key) => {
  const [y, m] = key.split("-");
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
};

export default function RevenueScreen({ navigation }) {
  const { colors, spacing, radius } = useTheme();
  const [basis, setBasis] = useState("collected");
  // The month the 6-month window ENDS at ("YYYY-MM"); chosen via the picker.
  // Defaults to the current month; can be any past month.
  const [endMonth, setEndMonth] = useState(currentMonthKey());
  // Which month within the window drives the headline; null => the anchor month.
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  // The totals card is scoped to a CALENDAR YEAR, independent of the 6-month
  // window that drives the chart/headline above.
  const [totalsYear, setTotalsYear] = useState(currentYear());

  // The account's registration month bounds how far back the picker can go —
  // there's no revenue data before the business existed.
  const { data: profile } = useProfile();
  const minKey = profile?.tenants?.created_at
    ? String(profile.tenants.created_at).slice(0, 7) // "YYYY-MM"
    : null;
  // The totals year can't go back before the business existed.
  const minYear = minKey ? Number(minKey.slice(0, 4)) : currentYear() - 5;

  const { data, error, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["revenue", MONTHS_WINDOW, endMonth],
    queryFn: () => dashboardAPI.getRevenue(MONTHS_WINDOW, endMonth),
  });

  // Totals card: its own year-scoped fetch (Jan..Dec, or Jan..this month for the
  // ongoing year so we never request future buckets).
  const yearEnd = useMemo(() => {
    const nowKey = currentMonthKey();
    const decKey = `${totalsYear}-12`;
    return decKey > nowKey ? nowKey : decKey;
  }, [totalsYear]);
  const yearMonths = Number(yearEnd.split("-")[1]);

  const { data: yearData, isLoading: yearLoading } = useQuery({
    queryKey: ["revenue", yearMonths, yearEnd],
    queryFn: () => dashboardAPI.getRevenue(yearMonths, yearEnd),
  });

  const months = data?.months || [];
  const totals = yearData?.totals || { collected: 0, billed: 0, outstanding: 0 };

  // API returns newest-first. Chart reads left(oldest) -> right(newest).
  const chartMonths = useMemo(() => [...months].reverse(), [months]);

  // Resolve the focused month: explicit chart selection, else the anchor (newest).
  const current =
    (selectedMonth && months.find((m) => m.month === selectedMonth)) || months[0];

  // Jump the whole window to end at the picked month; clear any within-window
  // selection so the headline follows the new anchor.
  const handlePickMonth = (key) => {
    setEndMonth(key);
    setSelectedMonth(null);
    setPickerOpen(false);
  };

  // Scale columns to the largest value on the active basis in the window.
  const peak = Math.max(1, ...months.map((m) => m[basis] || 0));
  const activeBasis = BASES.find((b) => b.key === basis);

  if (isLoading && !data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
        <Skeleton width="100%" height={120} radius={radius.lg} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={44} radius={radius.full} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={260} radius={radius.lg} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <EmptyState
          tone="error"
          icon="cloud-off-outline"
          title="Couldn't load revenue"
          message={error.message || "Failed to load revenue"}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  const focusedKey = current?.month || null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} tintColor={colors.primary} onRefresh={refetch} />
      }
    >
      {/* Month picker trigger — jump the window to end at ANY past month. */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setPickerOpen(true)}
        style={[
          styles.pickerTrigger,
          { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radius.md },
        ]}
      >
        <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.primary} />
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700", flex: 1, marginLeft: 10 }}>
          {monthLabel(endMonth)}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginRight: 6 }}>
          Change month
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Headline — the selected month */}
      <Animated.View entering={FadeInDown.duration(320)}>
        <Card style={{ marginBottom: spacing.md }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "500" }}>
            {current ? monthLabel(current.month) : "This month"} · {activeBasis.hint}
          </Text>
          <Text style={{ color: colors.text, fontSize: 32, fontWeight: "800", marginTop: 2 }}>
            {formatMoney(current ? current[basis] : 0)}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Billed</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {formatMoney(current?.billed || 0)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Collected</Text>
              <Text style={[styles.metaValue, { color: colors.success }]}>
                {formatMoney(current?.collected || 0)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Outstanding</Text>
              <Text style={[styles.metaValue, { color: colors.danger }]}>
                {formatMoney(current?.outstanding || 0)}
              </Text>
            </View>
          </View>

          {current && (
            <Button
              title={`View ${monthLabel(current.month)} bills`}
              icon="receipt"
              variant="secondary"
              size="sm"
              style={{ marginTop: spacing.md }}
              onPress={() =>
                navigation.navigate("Bills", {
                  month: current.month,
                  title: monthLabel(current.month),
                })
              }
            />
          )}
        </Card>
      </Animated.View>

      {/* Basis toggle */}
      <View style={styles.toggle}>
        {BASES.map((b) => {
          const active = basis === b.key;
          return (
            <TouchableOpacity
              key={b.key}
              activeOpacity={0.7}
              style={[
                styles.toggleTab,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setBasis(b.key)}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: active ? "600" : "500",
                  color: active ? colors.onPrimary : colors.textSecondary,
                }}
              >
                {b.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Column chart — tap a bar to focus that month. */}
      <Animated.View entering={FadeInDown.delay(80).duration(340)}>
        <Card>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: spacing.md }}>
            Last {months.length} months · {activeBasis.label}
          </Text>

          {chartMonths.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 14, paddingVertical: spacing.md }}>
              No revenue in this period yet.
            </Text>
          ) : (
            <View style={styles.chart}>
              {/* Peak reference line + label */}
              <View style={[styles.gridLine, { top: 0, borderColor: colors.border }]} />
              <Text style={[styles.peakLabel, { color: colors.textMuted }]}>
                {formatShort(peak)}
              </Text>

              <View style={styles.columns}>
                {chartMonths.map((m) => {
                  const value = m[basis] || 0;
                  const active = focusedKey === m.month;
                  const h = Math.max((value / peak) * CHART_HEIGHT, value > 0 ? 4 : 0);
                  return (
                    <TouchableOpacity
                      key={m.month}
                      activeOpacity={0.7}
                      style={styles.column}
                      onPress={() => setSelectedMonth(m.month)}
                    >
                      {/* value label above the bar (only for the focused one to avoid clutter) */}
                      {active && value > 0 && (
                        <Text style={[styles.barValue, { color: colors.text }]}>
                          {formatShort(value)}
                        </Text>
                      )}
                      <View style={styles.barSlot}>
                        <View
                          style={{
                            width: 26,
                            height: h,
                            borderTopLeftRadius: radius.sm,
                            borderTopRightRadius: radius.sm,
                            backgroundColor: active
                              ? colors.primary
                              : withAlpha(colors.primary, 0.35),
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 11,
                          marginTop: 6,
                          fontWeight: active ? "700" : "500",
                          color: active ? colors.primary : colors.textSecondary,
                        }}
                      >
                        {monthTick(m.month)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </Card>
      </Animated.View>

      {/* Window totals */}
      <Animated.View entering={FadeInDown.delay(160).duration(340)}>
        <Card style={{ marginTop: spacing.md }}>
          {/* Year scope — names the period AND lets you switch it, so these
              figures can't be misread as all-time totals. */}
          <View style={styles.totalsHeader}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>Totals</Text>
            <View style={styles.yearStepper}>
              <TouchableOpacity
                onPress={() => setTotalsYear((y) => y - 1)}
                disabled={totalsYear <= minYear}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={22}
                  color={totalsYear <= minYear ? colors.textMuted : colors.primary}
                />
              </TouchableOpacity>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 14,
                  fontWeight: "700",
                  minWidth: 46,
                  textAlign: "center",
                }}
              >
                {totalsYear}
              </Text>
              <TouchableOpacity
                onPress={() => setTotalsYear((y) => y + 1)}
                disabled={totalsYear >= currentYear()}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={totalsYear >= currentYear() ? colors.textMuted : colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
          {totalsYear === currentYear() && (
            <Text style={{ color: colors.textMuted, fontSize: 11, marginBottom: 6 }}>
              Jan–{monthTick(yearEnd)} {totalsYear} (year to date)
            </Text>
          )}
          <View style={styles.totalRow}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Total collected</Text>
            <Text style={{ color: colors.success, fontSize: 15, fontWeight: "700" }}>
              {formatMoney(totals.collected)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Total billed</Text>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
              {formatMoney(totals.billed)}
            </Text>
          </View>
          <View style={[styles.totalRow, { borderBottomWidth: 0 }]}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Outstanding dues</Text>
            <Text style={{ color: colors.danger, fontSize: 15, fontWeight: "700" }}>
              {formatMoney(totals.outstanding)}
            </Text>
          </View>
        </Card>
      </Animated.View>

      <MonthPicker
        visible={pickerOpen}
        value={endMonth}
        maxKey={currentMonthKey()}
        minKey={minKey}
        onSelect={handlePickMonth}
        onClose={() => setPickerOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.15)",
  },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 12, marginBottom: 2 },
  metaValue: { fontSize: 15, fontWeight: "700" },
  toggle: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
  },
  // Chart
  chart: {
    paddingTop: 22, // room for the focused bar's value label + peak label
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  peakLabel: {
    position: "absolute",
    right: 0,
    top: -6,
    fontSize: 10,
    fontWeight: "600",
  },
  columns: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
    alignItems: "center",
  },
  barSlot: {
    height: CHART_HEIGHT,
    justifyContent: "flex-end",
  },
  barValue: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  totalsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  yearStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.15)",
  },
});

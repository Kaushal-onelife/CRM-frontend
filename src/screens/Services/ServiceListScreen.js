import React, { useState, useCallback, useRef, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { serviceAPI } from "../../services/api";
import ServiceCard from "../../components/ServiceCard";
import { EmptyState, SkeletonList, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

const FILTERS = [
  "all",
  "upcoming",
  "due",
  "pending",
  "followup",
  "completed",
  "rejected",
];

const FILTER_LABELS = {
  all: "All",
  upcoming: "Upcoming",
  due: "Due",
  pending: "Pending",
  followup: "Follow Up",
  completed: "Completed",
  rejected: "Rejected",
};

// Date-range options for the sort/range button. `days` = how far back to include
// (null = all time). Defaults to 30 days so the list stays focused at scale.
const RANGES = [
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
  { key: "365", label: "This year", days: 365 },
  { key: "all", label: "All time", days: null },
];

// Returns a YYYY-MM-DD `from` date N days ago, or "" for all-time.
const fromDate = (days) => {
  if (!days) return "";
  return new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
};

export default function ServiceListScreen({ navigation, route }) {
  const { colors, spacing, radius, elevation } = useTheme();
  const toast = useToast();
  // An initial filter can be passed in (e.g. tapping a Dashboard stat card).
  const [activeFilter, setActiveFilter] = useState(route?.params?.filter || "all");

  // The screen stays mounted in the tab stack, so a fresh `useState` won't pick
  // up a new `filter` param on repeat navigations (e.g. tapping a different
  // Dashboard box). Apply the param every time the screen gains focus, then
  // clear it so manual filter changes aren't overridden on a later return.
  useFocusEffect(
    useCallback(() => {
      const f = route?.params?.filter;
      if (f) {
        setActiveFilter(f);
        resetPagination();
        navigation.setParams({ filter: undefined });
      }
    }, [route?.params?.filter])
  );
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [rangeKey, setRangeKey] = useState("30"); // default: last 30 days
  const [showRange, setShowRange] = useState(false); // range dropdown visibility
  // Pages beyond the first are appended here; the first page comes from useQuery.
  const [extraServices, setExtraServices] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef(null);

  const buildParams = (filter, pageNum, searchTerm, rKey) => {
    const params = new URLSearchParams({ page: pageNum, limit: 20 });
    if (filter !== "all") params.set("status", filter);
    if (searchTerm) params.set("search", searchTerm);
    // Apply the date window ONLY in the default view — not when searching or when
    // a status chip is active — so the user never loses matching results.
    if (!searchTerm && filter === "all") {
      const range = RANGES.find((r) => r.key === rKey);
      const from = fromDate(range?.days);
      if (from) params.set("from", from);
    }
    return params.toString();
  };

  // Cache-first first page; reset pagination whenever filter/search/range changes.
  const {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["services", activeFilter, debouncedSearch, rangeKey],
    queryFn: () => serviceAPI.getAll(buildParams(activeFilter, 1, debouncedSearch, rangeKey)),
  });

  // Debounce the search input (matches the customer-search pattern).
  const handleSearch = (text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length === 0) {
      setDebouncedSearch("");
      resetPagination();
      return;
    }
    if (text.length <= 2) return; // wait for 3+ chars
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(text);
      resetPagination();
    }, 300);
  };

  useEffect(() => {
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, []);

  const firstPage = data?.services || [];
  const services = [...firstPage, ...extraServices];
  // No more pages once the first page came back short, or a later page did.
  const canLoadMore = firstPage.length >= 20 && hasMore;

  const handleLoadMore = async () => {
    if (loadingMore || !canLoadMore || isLoading) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await serviceAPI.getAll(buildParams(activeFilter, nextPage, debouncedSearch, rangeKey));
      const newData = result.services || [];
      setExtraServices((prev) => [...prev, ...newData]);
      setPage(nextPage);
      setHasMore(newData.length >= 20);
    } catch (err) {
      toast.error("Failed to load services");
    } finally {
      setLoadingMore(false);
    }
  };

  // Drop any appended pages so we show only the freshly-fetched first page.
  const resetPagination = () => {
    setExtraServices([]);
    setPage(1);
    setHasMore(true);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    resetPagination();
  };

  const handleServicePress = useCallback(
    (service) => navigation.navigate("ServiceDetail", { id: service.id }),
    [navigation]
  );

  const renderServiceItem = useCallback(
    ({ item, index }) => (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}>
        <ServiceCard service={item} onPress={handleServicePress} />
      </Animated.View>
    ),
    [handleServicePress]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg }}>
      {/* Search bar + filter toggle */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: spacing.sm }}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            height: 46,
            backgroundColor: colors.surface,
            borderWidth: 1.5,
            borderColor: searchFocused ? colors.primary : colors.border,
            borderRadius: radius.md,
            paddingHorizontal: 12,
          }}
        >
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={searchFocused ? colors.primary : colors.textMuted}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={{ flex: 1, color: colors.text, fontSize: 15, paddingVertical: 0, outlineStyle: "none", outlineWidth: 0 }}
            placeholder="Search by customer or service type..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            underlineColorAndroid="transparent"
          />
        </View>
        {/* Date-range (sort) button — only meaningful in the default view. */}
        {!debouncedSearch && activeFilter === "all" && (
          <TouchableOpacity
            onPress={() => setShowRange((s) => !s)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: 46,
              paddingHorizontal: 12,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: showRange ? colors.primary : colors.border,
              backgroundColor: showRange ? colors.primarySoft : colors.surface,
              gap: 4,
            }}
          >
            <MaterialCommunityIcons
              name="calendar-range"
              size={18}
              color={showRange ? colors.primary : colors.textSecondary}
            />
            <MaterialCommunityIcons
              name="chevron-down"
              size={16}
              color={showRange ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Range dropdown */}
      {showRange && !debouncedSearch && activeFilter === "all" && (
        <View
          style={{
            marginTop: spacing.sm,
            backgroundColor: colors.card,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          {RANGES.map((r, i) => {
            const active = rangeKey === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                activeOpacity={0.7}
                onPress={() => {
                  setRangeKey(r.key);
                  setShowRange(false);
                  resetPagination();
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.divider,
                  backgroundColor: active ? colors.primarySoft : "transparent",
                }}
              >
                <Text style={{ color: active ? colors.primary : colors.text, fontSize: 14, fontWeight: active ? "600" : "400" }}>
                  {r.label}
                </Text>
                {active && <MaterialCommunityIcons name="check" size={18} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Filter chips — always visible, horizontally scrollable on one row.
          Each chip uses flexShrink:0 so react-native-web can't squish it (a
          horizontal ScrollView on web otherwise collapses the children's
          padding/shape, making them look flat). Hidden during cold-load. */}
      {!(isLoading && !data) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // flexGrow:0 keeps the row from stretching to fill vertical space, but
          // we intentionally DON'T pin a fixed height: the chips carry a 1px
          // border, so a hard 34px viewport clipped the pills top & bottom on
          // web. Letting the content define the height keeps them fully visible.
          // Negative horizontal margins cancel the screen's paddingHorizontal so
          // the row bleeds edge-to-edge; the content padding then re-aligns the
          // first chip with the content and lets the last chip scroll fully into
          // view instead of being clipped flush against the screen edge.
          style={{
            marginTop: spacing.md,
            marginHorizontal: -spacing.lg,
            flexGrow: 0,
          }}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingVertical: 2,
            alignItems: "center",
          }}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.7}
                style={{
                  flexShrink: 0,
                  height: 34,
                  justifyContent: "center",
                  paddingHorizontal: 14,
                  borderRadius: radius.full,
                  marginRight: spacing.sm,
                  borderWidth: 1,
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
                onPress={() => handleFilterChange(filter)}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 13,
                    // Keep a CONSTANT weight for active + inactive. Bold text is
                    // wider than regular, so switching weight changed the chip's
                    // width and made the spacing appear to jump. The solid blue
                    // background is enough to mark the active chip.
                    fontWeight: "600",
                    color: isActive ? colors.onPrimary : colors.textSecondary,
                  }}
                >
                  {FILTER_LABELS[filter] || filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={{ height: spacing.sm }} />

      {/* flex:1 wrapper claims all remaining space below the chips so the list
          scrolls inside its own bounds and can't overlap the chips above. */}
      <View style={{ flex: 1 }}>
      {isLoading && !data ? (
        <SkeletonList count={6} />
      ) : error && !data ? (
        <EmptyState
          tone="error"
          icon="cloud-off-outline"
          title="Couldn't load services"
          message={error.message || "Failed to load services"}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={services}
          keyExtractor={keyExtractor}
          renderItem={renderServiceItem}
          // flex:1 bounds the list to the space left below the chips. Without it
          // the list (on web) grows to full content height and its scroll area
          // overflows upward, sliding cards over the filter chips.
          style={{ flex: 1 }}
          ListEmptyComponent={
            <EmptyState
              icon="clipboard-text-outline"
              title="No services found"
              message={
                activeFilter === "all"
                  ? "Schedule your first service to get started."
                  : `No ${FILTER_LABELS[activeFilter]?.toLowerCase() || activeFilter} services right now.`
              }
              actionLabel="Add Service"
              onAction={() => navigation.navigate("AddService")}
            />
          }
          contentContainerStyle={{ paddingBottom: 96, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              tintColor={colors.primary}
              onRefresh={() => {
                resetPagination();
                refetch();
              }}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: spacing.lg }}
              />
            ) : null
          }
        />
      )}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          {
            position: "absolute",
            right: spacing.xl,
            bottom: spacing.xl,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
          },
          elevation("lg"),
        ]}
        onPress={() => navigation.navigate("AddService")}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

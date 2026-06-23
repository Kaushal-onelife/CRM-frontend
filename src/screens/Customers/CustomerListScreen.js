import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useInfiniteQuery } from "@tanstack/react-query";
import { customerAPI } from "../../services/api";
import { Card, EmptyState, SkeletonList, useToast, alert } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import { downloadCsv, pickCsvText, fileSupported } from "../../utils/fileTransfer";

const PAGE_SIZE = 20;

export default function CustomerListScreen({ navigation }) {
  const { colors, radius, elevation } = useTheme();
  const toast = useToast();
  const [search, setSearch] = useState("");
  // The actual query term, updated debounced — separate from the input value so
  // typing doesn't refire the query on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const debounceRef = useRef(null);

  // useInfiniteQuery handles pagination + caching + persistence (offline) and
  // replaces the old manual page/hasMore/loadingMore/stale-guard machinery.
  // The cache key includes debouncedSearch so each search term caches separately
  // and stale responses are dropped automatically by React Query.
  const {
    data,
    error,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["customers", debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({ page: pageParam, limit: PAGE_SIZE });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const result = await customerAPI.getAll(params.toString());
      return result.customers || [];
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length >= PAGE_SIZE ? allPages.length + 1 : undefined,
  });

  // Flatten all loaded pages into one list for the FlatList.
  const customers = data?.pages.flat() || [];

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length === 0) {
      setDebouncedSearch(""); // reset immediately when cleared
      return;
    }
    if (text.length <= 2) return; // don't search on 1-2 chars (matches old behavior)

    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage();
    }
  };

  // True only while a debounced search query is actively fetching its first page.
  const searching = search.length > 2 && isLoading;

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await customerAPI.exportCsv();
      const stamp = new Date().toISOString().split("T")[0];
      downloadCsv(`customers-${stamp}.csv`, csv);
    } catch (err) {
      toast.error(err.message || "Could not export customers.");
    }
    setExporting(false);
  };

  const handleImport = async () => {
    try {
      const csv = await pickCsvText();
      if (!csv) return; // user cancelled
      setImporting(true);
      const { summary, errors } = await customerAPI.importCsv(csv, "update");

      const lines = [
        `Added: ${summary.inserted}`,
        `Updated: ${summary.updated}`,
        summary.skipped ? `Skipped: ${summary.skipped}` : null,
        summary.failed ? `Failed rows: ${summary.failed}` : null,
      ].filter(Boolean);

      // Show up to the first few row errors so the user can fix the file.
      if (errors && errors.length) {
        const preview = errors
          .slice(0, 5)
          .map((e) => (e.row ? `Row ${e.row}: ${e.error}` : e.error))
          .join("\n");
        lines.push("", "Issues:", preview);
        if (errors.length > 5) lines.push(`…and ${errors.length - 5} more`);
      }

      // Multi-line import report — branded dialog the user can read.
      alert.show({ title: "Import complete", message: lines.join("\n") });
      refetch(); // refresh list
    } catch (err) {
      toast.error(err.message || "Could not import customers.");
    }
    setImporting(false);
  };

  const renderCustomer = ({ item }) => (
    <Card
      onPress={() =>
        navigation.navigate("CustomerDetail", { id: item.id, name: item.name })
      }
      style={styles.card}
      padded={false}
    >
      <View style={styles.cardInner}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.phone, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.phone}
          </Text>
          {item.city ? (
            <Text style={[styles.city, { color: colors.textMuted }]} numberOfLines={1}>
              {item.city}
            </Text>
          ) : null}
        </View>
        {item.purifier_model ? (
          <Text style={[styles.model, { color: colors.textMuted }]} numberOfLines={1}>
            {item.purifier_model}
          </Text>
        ) : null}
        <MaterialCommunityIcons
          name="chevron-right"
          size={22}
          color={colors.textMuted}
          style={{ marginLeft: 4 }}
        />
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Export / Import toolbar */}
      {fileSupported ? (
        <View style={styles.toolbar}>
          <Pressable
            onPress={handleExport}
            disabled={exporting}
            style={({ pressed }) => [
              styles.toolBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius.md,
                opacity: pressed || exporting ? 0.7 : 1,
              },
            ]}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="download-outline" size={18} color={colors.primary} />
            )}
            <Text style={[styles.toolBtnText, { color: colors.text }]}>Export</Text>
          </Pressable>

          <Pressable
            onPress={handleImport}
            disabled={importing}
            style={({ pressed }) => [
              styles.toolBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radius.md,
                opacity: pressed || importing ? 0.7 : 1,
              },
            ]}
          >
            {importing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="upload-outline" size={18} color={colors.primary} />
            )}
            <Text style={[styles.toolBtnText, { color: colors.text }]}>Import</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Search */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: searchFocused ? colors.primary : colors.border,
            borderRadius: radius.md,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={searchFocused ? colors.primary : colors.textMuted}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={{
            flex: 1,
            color: colors.text,
            fontSize: 15,
            paddingVertical: 0,
            outlineStyle: "none",
            outlineWidth: 0,
          }}
          placeholder="Search by name or phone..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={handleSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          underlineColorAndroid="transparent"
        />
        {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {/* Skeleton only when first load has no cached data yet. */}
      {isLoading && customers.length === 0 ? (
        <View style={{ marginTop: 4 }}>
          <SkeletonList count={6} />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomer}
          ListEmptyComponent={
            error ? (
              <EmptyState
                tone="error"
                icon="cloud-off-outline"
                title="Couldn't load customers"
                message={error.message || "Failed to load customers"}
                actionLabel="Try again"
                onAction={() => refetch()}
              />
            ) : (
              <EmptyState
                icon="account-search-outline"
                title="No customers found"
                message={
                  search
                    ? "Try a different name or phone number."
                    : "Add your first customer to get started."
                }
                actionLabel={search ? undefined : "Add Customer"}
                onAction={search ? undefined : () => navigation.navigate("AddCustomer")}
              />
            )
          }
          contentContainerStyle={{ paddingBottom: 96 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              tintColor={colors.primary}
              onRefresh={() => refetch()}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
        />
      )}

      {/* FAB */}
      <Animated.View
        entering={FadeInDown.delay(150).duration(350)}
        style={styles.fabWrap}
      >
        <Pressable
          onPress={() => navigation.navigate("AddCustomer")}
          style={[
            styles.fab,
            { backgroundColor: colors.primary },
            elevation("lg"),
          ]}
        >
          <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  toolbar: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  toolBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    borderWidth: 1,
    gap: 6,
  },
  toolBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  card: {
    marginBottom: 10,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
  },
  phone: {
    fontSize: 13,
    marginTop: 2,
  },
  city: {
    fontSize: 12,
    marginTop: 1,
  },
  model: {
    fontSize: 12,
    maxWidth: 90,
    textAlign: "right",
    marginLeft: 8,
  },
  fabWrap: {
    position: "absolute",
    right: 20,
    bottom: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});

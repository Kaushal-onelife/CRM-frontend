import React, { useState, useCallback, useRef, useEffect } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { customerAPI } from "../../services/api";
import { Card, EmptyState, SkeletonList } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";

export default function CustomerListScreen({ navigation }) {
  const { colors, radius, elevation } = useTheme();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const debounceRef = useRef(null);
  const lastQueryRef = useRef("");

  const fetchCustomers = async (
    searchText = "",
    pageNum = 1,
    append = false
  ) => {
    lastQueryRef.current = searchText;
    if (append) setLoadingMore(true);
    if (searchText && !append) setSearching(true);
    try {
      const params = new URLSearchParams({ page: pageNum, limit: 20 });
      if (searchText) params.set("search", searchText);
      const result = await customerAPI.getAll(params.toString());
      // Drop stale search responses if the query changed mid-flight.
      if (!append && lastQueryRef.current !== searchText) return;
      const newData = result.customers || [];
      setCustomers(append ? (prev) => [...prev, ...newData] : newData);
      setPage(pageNum);
      setHasMore(newData.length >= 20);
      setError(null);
    } catch (err) {
      if (!append && lastQueryRef.current !== searchText) return;
      console.error(err.message);
      setError(err.message || "Failed to load customers");
      if (!append) setCustomers([]);
    } finally {
      if (append || lastQueryRef.current === searchText) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setSearching(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers("", 1);
    }, [])
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length === 0) {
      // Reset immediately when cleared.
      fetchCustomers("", 1);
      return;
    }
    if (text.length <= 2) return;

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      fetchCustomers(text, 1);
    }, 300);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchCustomers(search, page + 1, true);
    }
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

      {loading ? (
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
                message={error}
                actionLabel="Try again"
                onAction={() => {
                  setLoading(true);
                  fetchCustomers(search, 1);
                }}
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
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={() => {
                setRefreshing(true);
                fetchCustomers(search, 1);
              }}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
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

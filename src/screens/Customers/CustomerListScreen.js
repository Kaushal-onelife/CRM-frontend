import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { customerAPI } from "../../services/api";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

export default function CustomerListScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async (searchText = "") => {
    try {
      const params = searchText ? `search=${searchText}` : "";
      const result = await customerAPI.getAll(params);
      setCustomers(result.customers);
    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [])
  );

  const handleSearch = (text) => {
    setSearch(text);
    if (text.length > 2 || text.length === 0) {
      fetchCustomers(text);
    }
  };

  const renderCustomer = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("CustomerDetail", { id: item.id, name: item.name })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.phone}>{item.phone}</Text>
        {item.city && <Text style={styles.city}>{item.city}</Text>}
      </View>
      <Text style={styles.model}>{item.purifier_model || ""}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or phone..."
        value={search}
        onChangeText={handleSearch}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No customers found</Text>
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddCustomer")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  searchInput: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    ...FONTS.bold,
    color: COLORS.primary,
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  name: {
    ...FONTS.bold,
  },
  phone: {
    ...FONTS.small,
    marginTop: 2,
  },
  city: {
    ...FONTS.small,
    color: COLORS.gray,
  },
  model: {
    ...FONTS.small,
    color: COLORS.gray,
  },
  emptyText: {
    ...FONTS.regular,
    color: COLORS.gray,
    textAlign: "center",
    marginTop: 40,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { customerAPI } from "../../services/api";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

const FIELDS = [
  { key: "name", label: "Customer Name *", placeholder: "Full name" },
  { key: "phone", label: "Phone *", placeholder: "10-digit number", keyboardType: "phone-pad" },
  { key: "email", label: "Email", placeholder: "Optional", keyboardType: "email-address" },
  { key: "address", label: "Address", placeholder: "Full address" },
  { key: "city", label: "City", placeholder: "City" },
  { key: "purifier_brand", label: "Purifier Brand", placeholder: "e.g. Kent, Aquaguard" },
  { key: "purifier_model", label: "Purifier Model", placeholder: "e.g. Grand Plus" },
  { key: "notes", label: "Notes", placeholder: "Any additional notes" },
];

export default function EditCustomerScreen({ route, navigation }) {
  const { id, customer } = route.params;
  const [form, setForm] = useState({ ...customer });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => setForm({ ...form, [key]: value });

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      Alert.alert("Error", "Name and Phone are required");
      return;
    }

    setLoading(true);
    try {
      await customerAPI.update(id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        city: form.city,
        purifier_brand: form.purifier_brand,
        purifier_model: form.purifier_model,
        notes: form.notes,
      });
      Alert.alert("Success", "Customer updated successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {FIELDS.map((field) => (
        <View key={field.key}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            style={[
              styles.input,
              field.key === "notes" && { height: 80, textAlignVertical: "top" },
            ]}
            placeholder={field.placeholder}
            value={form[field.key] || ""}
            onChangeText={(v) => updateForm(field.key, v)}
            keyboardType={field.keyboardType || "default"}
            autoCapitalize={field.key === "email" ? "none" : "words"}
            multiline={field.key === "notes"}
          />
        </View>
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Update Customer</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, paddingBottom: 40 },
  label: { ...FONTS.medium, marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: COLORS.white,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 28,
  },
  buttonText: { color: COLORS.white, ...FONTS.bold },
});

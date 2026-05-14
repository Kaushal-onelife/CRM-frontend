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
import {
  isRequired,
  isEmail,
  isPhone,
  maxLength,
  firstError,
  trimAll,
} from "../../utils/validators";

const FIELDS = [
  { key: "name", label: "Customer Name *", placeholder: "Full name" },
  {
    key: "phone",
    label: "Phone *",
    placeholder: "10-digit number",
    keyboardType: "phone-pad",
  },
  {
    key: "email",
    label: "Email",
    placeholder: "Optional",
    keyboardType: "email-address",
  },
  { key: "address", label: "Address", placeholder: "Full address" },
  { key: "city", label: "City", placeholder: "City" },
  {
    key: "purifier_brand",
    label: "Purifier Brand",
    placeholder: "e.g. Kent, Aquaguard",
  },
  {
    key: "purifier_model",
    label: "Purifier Model",
    placeholder: "e.g. Grand Plus",
  },
  { key: "notes", label: "Notes", placeholder: "Any additional notes" },
];

export default function AddCustomerScreen({ navigation }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => setForm({ ...form, [key]: value });

  const handleSubmit = async () => {
    const cleaned = trimAll(form);

    const error = firstError([
      isRequired(cleaned.name, "Name"),
      maxLength(cleaned.name, 100, "Name"),
      isRequired(cleaned.phone, "Phone"),
      isPhone(cleaned.phone, "Phone"),
      isEmail(cleaned.email, "Email"),
      maxLength(cleaned.address, 300, "Address"),
      maxLength(cleaned.city, 80, "City"),
      maxLength(cleaned.purifier_brand, 80, "Brand"),
      maxLength(cleaned.purifier_model, 80, "Model"),
      maxLength(cleaned.notes, 500, "Notes"),
    ]);
    if (error) {
      Alert.alert("Invalid input", error);
      return;
    }

    setLoading(true);
    try {
      await customerAPI.create(cleaned);
      Alert.alert("Success", "Customer added successfully");
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
          <Text style={styles.buttonText}>Add Customer</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SIZES.padding,
    paddingBottom: 40,
  },
  label: {
    ...FONTS.medium,
    marginBottom: 6,
    marginTop: 14,
  },
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
  buttonText: {
    color: COLORS.white,
    ...FONTS.bold,
  },
});

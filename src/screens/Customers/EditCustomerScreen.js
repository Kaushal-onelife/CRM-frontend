import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useQueryClient } from "@tanstack/react-query";
import { customerAPI } from "../../services/api";
import { requireOnline } from "../../hooks/useRequireOnline";
import { Input, Button, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import {
  isRequired,
  isEmail,
  isPhone,
  maxLength,
  trimAll,
} from "../../utils/validators";

const FIELDS = [
  { key: "name", label: "Customer Name *", placeholder: "Full name", icon: "account-outline", max: 100 },
  {
    key: "phone",
    label: "Phone *",
    placeholder: "10-digit number",
    keyboardType: "phone-pad",
    icon: "phone-outline",
    numeric: true,
    maxDigits: 10,
  },
  {
    key: "email",
    label: "Email",
    placeholder: "Optional",
    keyboardType: "email-address",
    icon: "email-outline",
  },
  {
    key: "address",
    label: "Address",
    placeholder: "Flat/House no., Building, Street, Area, Landmark",
    icon: "map-marker-outline",
    max: 300,
  },
  { key: "city", label: "City", placeholder: "e.g. Pune", icon: "city-variant-outline", max: 80 },
  {
    key: "purifier_brand",
    label: "Purifier Brand",
    placeholder: "e.g. Kent, Aquaguard",
    icon: "water-outline",
    max: 80,
  },
  {
    key: "purifier_model",
    label: "Purifier Model",
    placeholder: "e.g. Grand Plus",
    icon: "cog-outline",
    max: 80,
  },
  { key: "notes", label: "Notes", placeholder: "Any additional notes", icon: "note-text-outline", max: 500 },
];

// Per-field validation — returns an error string or null. Used on blur + submit.
function validateField(key, value) {
  const v = (value || "").trim();
  switch (key) {
    case "name":
      return isRequired(v, "Name") || maxLength(v, 100, "Name");
    case "phone":
      return isRequired(v, "Phone") || isPhone(v, "Phone");
    case "email":
      return isEmail(v, "Email");
    case "address":
      return maxLength(v, 300, "Address");
    case "city":
      return maxLength(v, 80, "City");
    case "purifier_brand":
      return maxLength(v, 80, "Brand");
    case "purifier_model":
      return maxLength(v, 80, "Model");
    case "notes":
      return maxLength(v, 500, "Notes");
    default:
      return null;
  }
}

export default function EditCustomerScreen({ route, navigation }) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { id, customer } = route.params;
  // Preserve existing prefill from the passed-in customer record.
  const [form, setForm] = useState({ ...customer });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear a field's error as soon as the user starts correcting it.
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleBlur = (key) => {
    const err = validateField(key, form[key]);
    setErrors((prev) => ({ ...prev, [key]: err }));
  };

  const handleSubmit = async () => {
    if (!requireOnline()) return;
    // Validate every field; collect all errors so they all light up at once.
    const nextErrors = {};
    for (const f of FIELDS) {
      const err = validateField(f.key, form[f.key]);
      if (err) nextErrors[f.key] = err;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const cleaned = trimAll({
      name: form.name || "",
      phone: form.phone || "",
      email: form.email || "",
      address: form.address || "",
      city: form.city || "",
      purifier_brand: form.purifier_brand || "",
      purifier_model: form.purifier_model || "",
      notes: form.notes || "",
    });

    setLoading(true);
    try {
      await customerAPI.update(id, cleaned);
      // Refresh the list and this customer's detail so the edit shows immediately.
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      toast.success("Customer updated successfully");
      navigation.goBack();
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid
      extraScrollHeight={20}
    >
      {FIELDS.map((field) => (
        <Input
          key={field.key}
          label={field.label}
          icon={field.icon}
          placeholder={field.placeholder}
          value={form[field.key] || ""}
          error={errors[field.key]}
          onChangeText={(v) => {
            // Phone: strip anything that isn't a digit and cap length — so
            // letters simply can't be entered, and it can't exceed 10 digits.
            if (field.numeric) {
              v = v.replace(/\D/g, "").slice(0, field.maxDigits || 15);
            } else if (field.max) {
              v = v.slice(0, field.max);
            }
            updateForm(field.key, v);
          }}
          onBlur={() => handleBlur(field.key)}
          keyboardType={field.keyboardType || "default"}
          autoCapitalize={field.key === "email" ? "none" : "words"}
          multiline={field.key === "notes"}
          textAlignVertical={field.key === "notes" ? "top" : "auto"}
        />
      ))}

      <View style={{ marginTop: 12 }}>
        <Button
          title="Update Customer"
          icon="content-save-outline"
          loading={loading}
          disabled={loading}
          onPress={handleSubmit}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
});

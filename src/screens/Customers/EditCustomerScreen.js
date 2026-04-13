import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { customerAPI } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import FormInput, { FormSection } from "../../components/FormInput";

const FIELDS = [
  { key: "name",           label: "Customer Name",   placeholder: "Full name",                  icon: "account-outline",       required: true,  autoCapitalize: "words" },
  { key: "phone",          label: "Phone Number",    placeholder: "10-digit mobile number",     icon: "phone-outline",         required: true,  keyboardType: "phone-pad",    autoCapitalize: "none" },
  { key: "email",          label: "Email Address",   placeholder: "customer@email.com",         icon: "email-outline",                          keyboardType: "email-address", autoCapitalize: "none" },
  { key: "address",        label: "Address",         placeholder: "Street / area / locality",   icon: "home-outline",                           autoCapitalize: "words" },
  { key: "city",           label: "City",            placeholder: "City or town",               icon: "city-variant-outline",                   autoCapitalize: "words" },
  { key: "purifier_brand", label: "Purifier Brand",  placeholder: "e.g. Kent, Aquaguard",       icon: "water-pump",                             autoCapitalize: "words" },
  { key: "purifier_model", label: "Purifier Model",  placeholder: "e.g. Grand Plus",            icon: "water-outline",                          autoCapitalize: "words" },
  { key: "notes",          label: "Notes",           placeholder: "Any extra details…",          icon: "note-text-outline",      multiline: true, autoCapitalize: "sentences" },
];

export default function EditCustomerScreen({ route, navigation }) {
  const { id, customer } = route.params;
  const { colors } = useTheme();
  const [form, setForm] = useState({ ...customer });
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name?.trim() || !form.phone?.trim()) {
      Alert.alert("Missing info", "Name and Phone are required.");
      return;
    }
    setLoading(true);
    try {
      await customerAPI.update(id, {
        name:           form.name,
        phone:          form.phone,
        email:          form.email,
        address:        form.address,
        city:           form.city,
        purifier_brand: form.purifier_brand,
        purifier_model: form.purifier_model,
        notes:          form.notes,
      });
      Alert.alert("✓ Updated", "Customer details updated.", [
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 50 }}
      >
        <FormSection title="Customer Details" icon="account-edit-outline" colors={colors} />
        {FIELDS.map((f) => (
          <FormInput
            key={f.key}
            label={f.label}
            placeholder={f.placeholder}
            icon={f.icon}
            required={f.required}
            value={form[f.key] || ""}
            onChangeText={(v) => update(f.key, v)}
            keyboardType={f.keyboardType || "default"}
            autoCapitalize={f.autoCapitalize || "sentences"}
            multiline={f.multiline}
          />
        ))}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            marginTop: 8,
            backgroundColor: colors.primary,
            borderRadius: 16,
            height: 54,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
            opacity: loading ? 0.75 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 }}>
                Save Changes
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

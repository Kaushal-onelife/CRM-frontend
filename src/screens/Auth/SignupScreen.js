import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { authAPI } from "../../services/api";
import { supabase } from "../../services/supabase";
import { useTheme } from "../../context/ThemeContext";
import { Button, Card, Input, useToast } from "../../components/ui";
import {
  isRequired,
  isEmail,
  isPhone,
  minLength,
  maxLength,
} from "../../utils/validators";

// Per-field validation — returns an error string or null. Used on blur + submit.
function validateField(key, value) {
  const v = (value || "").trim();
  switch (key) {
    case "name":
      return isRequired(v, "Owner name") || maxLength(v, 100, "Owner name");
    case "businessName":
      return isRequired(v, "Business name") || maxLength(v, 100, "Business name");
    case "phone":
      return isRequired(v, "Phone") || isPhone(v, "Phone");
    case "email":
      return isRequired(v, "Email") || isEmail(v, "Email");
    case "password":
      // Password is intentionally not trimmed for length checks.
      return (
        isRequired(value, "Password") ||
        minLength(value, 6, "Password") ||
        maxLength(value, 72, "Password") // Supabase/bcrypt cap
      );
    default:
      return null;
  }
}

export default function SignupScreen({ navigation }) {
  const { colors, elevation } = useTheme();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear a field's error as soon as the user starts correcting it.
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleBlur = (key) => {
    setErrors((prev) => ({ ...prev, [key]: validateField(key, form[key]) }));
  };

  const fields = [
    {
      key: "name",
      label: "Owner Name",
      placeholder: "Your full name",
      icon: "account-outline",
    },
    {
      key: "businessName",
      label: "Business Name",
      placeholder: "e.g. Aqua Pure Services",
      icon: "store-outline",
    },
    {
      key: "phone",
      label: "Phone",
      placeholder: "10-digit mobile number",
      keyboardType: "phone-pad",
      icon: "phone-outline",
      numeric: true,
      maxDigits: 10,
    },
    {
      key: "email",
      label: "Email",
      placeholder: "your@email.com",
      keyboardType: "email-address",
      icon: "email-outline",
    },
    {
      key: "password",
      label: "Password",
      placeholder: "Min 6 characters",
      secure: true,
      icon: "lock-outline",
    },
  ];

  const handleSignup = async () => {
    // Validate every field; collect all errors so they all light up at once.
    const nextErrors = {};
    for (const f of fields) {
      const err = validateField(f.key, form[f.key]);
      if (err) nextErrors[f.key] = err;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const name = form.name.trim();
    const businessName = form.businessName.trim();
    const phone = form.phone.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    setLoading(true);
    try {
      await authAPI.signup({ name, businessName, phone, email, password });

      // Auto login after signup via backend
      const loginData = await authAPI.login({ email, password });

      // Set session so auth state listener picks it up
      const { error } = await supabase.auth.setSession({
        access_token: loginData.token,
        refresh_token: loginData.refresh_token,
      });

      if (error) throw error;
    } catch (error) {
      toast.error(error.message || "Signup failed");
    }
    setLoading(false);
  };

  return (
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      enableOnAndroid
      extraScrollHeight={20}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: colors.primary },
            elevation("lg"),
          ]}
        >
          <MaterialCommunityIcons name="account-plus" size={34} color={colors.onPrimary} />
        </View>
        <Text style={[styles.title, { color: colors.primary }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Register your business
        </Text>
      </View>

      <Card>
        {fields.map((field) => (
          <Input
            key={field.key}
            label={field.label}
            placeholder={field.placeholder}
            value={form[field.key]}
            error={errors[field.key]}
            onChangeText={(v) => {
              // Phone: strip non-digits and cap at 10 — letters can't be typed.
              if (field.numeric) {
                v = v.replace(/\D/g, "").slice(0, field.maxDigits || 15);
              }
              updateForm(field.key, v);
            }}
            onBlur={() => handleBlur(field.key)}
            icon={field.icon}
            keyboardType={field.keyboardType || "default"}
            secureTextEntry={field.secure}
            autoCapitalize={
              field.key === "email" || field.key === "password" ? "none" : "words"
            }
          />
        ))}

        <Button
          title="Create Account"
          onPress={handleSignup}
          loading={loading}
          icon="check"
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.link, { color: colors.primary }]}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </Card>

      <View style={{ height: 32 }} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 56,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 6,
  },
  link: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 14,
    fontWeight: "500",
  },
});

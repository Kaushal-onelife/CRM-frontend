import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { authAPI } from "../../services/api";
import { supabase } from "../../services/supabase";
import { COLORS, FONTS, SIZES } from "../../constants/theme";

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    phone: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const updateForm = (key, value) => setForm({ ...form, [key]: value });

  const handleSignup = async () => {
    const { name, businessName, phone, email, password } = form;

    if (!name || !businessName || !phone || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await authAPI.signup(form);

      // Auto login after signup
      await supabase.auth.signInWithPassword({ email, password });
    } catch (error) {
      Alert.alert("Signup Failed", error.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Register your business</Text>

      <View style={styles.form}>
        {[
          { key: "name", label: "Owner Name", placeholder: "Your full name" },
          {
            key: "businessName",
            label: "Business Name",
            placeholder: "e.g. Aqua Pure Services",
          },
          {
            key: "phone",
            label: "Phone",
            placeholder: "10-digit mobile number",
            keyboardType: "phone-pad",
          },
          {
            key: "email",
            label: "Email",
            placeholder: "your@email.com",
            keyboardType: "email-address",
          },
          {
            key: "password",
            label: "Password",
            placeholder: "Min 6 characters",
            secure: true,
          },
        ].map((field) => (
          <View key={field.key}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChangeText={(v) => updateForm(field.key, v)}
              keyboardType={field.keyboardType || "default"}
              secureTextEntry={field.secure}
              autoCapitalize={
                field.key === "email" || field.key === "password"
                  ? "none"
                  : "words"
              }
            />
          </View>
        ))}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SIZES.padding * 2,
    paddingTop: 60,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.primary,
    textAlign: "center",
  },
  subtitle: {
    ...FONTS.regular,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 24,
  },
  form: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 1.5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    ...FONTS.medium,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: COLORS.grayLight,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: COLORS.white,
    ...FONTS.bold,
  },
  link: {
    color: COLORS.primary,
    textAlign: "center",
    marginTop: 16,
    ...FONTS.regular,
  },
});

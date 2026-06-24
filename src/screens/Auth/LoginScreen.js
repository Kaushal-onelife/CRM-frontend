import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { authAPI } from "../../services/api";
import { supabase } from "../../services/supabase";
import { useTheme } from "../../context/ThemeContext";
import { Button, Card, Input, useToast } from "../../components/ui";
import { isRequired, isEmail } from "../../utils/validators";

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Per-field validation — returns an error string or null. Used on blur + submit.
  const validateField = (key, emailVal, passwordVal) => {
    if (key === "email") {
      const v = (emailVal ?? email).trim().toLowerCase();
      return isRequired(v, "Email") || isEmail(v, "Email");
    }
    if (key === "password") {
      return isRequired(passwordVal ?? password, "Password");
    }
    return null;
  };

  const handleBlur = (key) => {
    setErrors((prev) => ({ ...prev, [key]: validateField(key) }));
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    // Validate all fields; inline errors replace the old alert.
    const nextErrors = {
      email: validateField("email"),
      password: validateField("password"),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    try {
      // Call backend login - returns token + user profile
      const data = await authAPI.login({ email: trimmedEmail, password });

      // Set the session in Supabase so auth state listener picks it up
      const { error } = await supabase.auth.setSession({
        access_token: data.token,
        refresh_token: data.refresh_token,
      });

      if (error) throw error;
    } catch (error) {
      toast.error(error.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Image
          source={require("../../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage your clients effortlessly
        </Text>
      </View>

      <Card>
        <Text style={[styles.formHeading, { color: colors.text }]}>Welcome back</Text>

        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
          }}
          error={errors.email}
          onBlur={() => handleBlur("email")}
          icon="email-outline"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
          }}
          error={errors.password}
          onBlur={() => handleBlur("password")}
          icon="lock-outline"
          secureTextEntry
        />

        <Button
          title="Login"
          onPress={handleLogin}
          loading={loading}
          icon="login"
          style={{ marginTop: 8 }}
        />

        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={[styles.link, { color: colors.primary }]}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
  },
  formHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  link: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 14,
    fontWeight: "500",
  },
});

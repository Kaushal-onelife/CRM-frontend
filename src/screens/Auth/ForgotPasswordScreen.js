import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { authAPI } from "../../services/api";
import { supabase } from "../../services/supabase";
import { useTheme } from "../../context/ThemeContext";
import { Button, Card, Input, useToast } from "../../components/ui";
import { isRequired, isEmail, minLength } from "../../utils/validators";

// Two-step password reset:
//  1. "request" — user enters email, backend emails a 6-digit recovery code.
//  2. "reset"   — user enters the code + a new password; on success the backend
//                 returns a session and we log them straight in via setSession.
export default function ForgotPasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();

  const [step, setStep] = useState("request"); // "request" | "reset"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const emailError = isRequired(trimmedEmail, "Email") || isEmail(trimmedEmail, "Email");
    setErrors({ email: emailError });
    if (emailError) return;

    setLoading(true);
    try {
      await authAPI.forgotPassword({ email: trimmedEmail });
      toast.success("If that email is registered, a reset code is on its way.");
      setStep("reset");
    } catch (error) {
      toast.error(error.message || "Could not send reset code.");
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    const nextErrors = {
      code: isRequired(code, "Code"),
      password:
        isRequired(password, "Password") || minLength(password, 6, "Password"),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setLoading(true);
    try {
      const data = await authAPI.resetPassword({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        password,
      });

      // Backend returns tokens (same shape as login) — set the session so the
      // auth listener logs the user in with their new password.
      const { error } = await supabase.auth.setSession({
        access_token: data.token,
        refresh_token: data.refresh_token,
      });
      if (error) throw error;

      toast.success("Password updated. You're now signed in.");
    } catch (error) {
      toast.error(error.message || "Invalid or expired code.");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Card>
        <Text style={[styles.formHeading, { color: colors.text }]}>
          {step === "request" ? "Reset your password" : "Enter reset code"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {step === "request"
            ? "Enter your account email and we'll send you a 6-digit code."
            : `We sent a code to ${email.trim().toLowerCase()}. Enter it below along with your new password.`}
        </Text>

        {step === "request" ? (
          <>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              error={errors.email}
              icon="email-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title="Send code"
              onPress={handleSendCode}
              loading={loading}
              icon="email-fast-outline"
              style={{ marginTop: 8 }}
            />
          </>
        ) : (
          <>
            <Input
              label="Reset code"
              placeholder="6-digit code"
              value={code}
              onChangeText={(v) => {
                setCode(v.replace(/\D/g, ""));
                if (errors.code) setErrors((prev) => ({ ...prev, code: null }));
              }}
              error={errors.code}
              icon="numeric"
              keyboardType="number-pad"
              maxLength={6}
            />
            <Input
              label="New password"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: null }));
              }}
              error={errors.password}
              icon="lock-outline"
              secureTextEntry
            />
            <Button
              title="Update password"
              onPress={handleResetPassword}
              loading={loading}
              icon="lock-check-outline"
              style={{ marginTop: 8 }}
            />
            <TouchableOpacity onPress={handleSendCode} disabled={loading}>
              <Text style={[styles.link, { color: colors.primary }]}>
                Didn't get a code? Resend
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={[styles.link, { color: colors.textSecondary }]}>
            Back to login
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
  formHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  link: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 14,
    fontWeight: "500",
  },
});

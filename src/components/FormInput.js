import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

/**
 * Premium form input field used across all form screens.
 * Supports icon, multiline, focused state, and theme-aware styling.
 */
export default function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
  icon,
  required = false,
  secureTextEntry = false,
}) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Label */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: focused ? colors.primary : colors.textSecondary,
          marginBottom: 7,
        }}
      >
        {label}
        {required && (
          <Text style={{ color: "#EF4444" }}> *</Text>
        )}
      </Text>

      {/* Input wrapper */}
      <View
        style={{
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          backgroundColor: colors.card,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: focused
            ? colors.primary
            : isDark ? "#2D2D44" : "#E8EDF5",
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          shadowColor: focused ? colors.primary : "#000",
          shadowOffset: { width: 0, height: focused ? 3 : 1 },
          shadowOpacity: focused ? 0.12 : 0.04,
          shadowRadius: focused ? 8 : 4,
          elevation: focused ? 3 : 1,
        }}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={focused ? colors.primary : colors.textSecondary}
            style={{ marginRight: 10, marginTop: multiline ? 1 : 0 }}
          />
        )}
        <TextInput
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: "500",
            color: colors.text,
            height: multiline ? 90 : 50,
            textAlignVertical: multiline ? "top" : "center",
            paddingTop: multiline ? 2 : 0,
          }}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#4B5563" : "#B0BAC8"}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

/**
 * Small section divider used inside forms to group related fields.
 */
export function FormSection({ title, icon, colors }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 18,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border || "#E8EDF5",
      }}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={16}
          color={colors.primary}
          style={{ marginRight: 7 }}
        />
      )}
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          letterSpacing: 0.4,
          color: colors.textSecondary,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

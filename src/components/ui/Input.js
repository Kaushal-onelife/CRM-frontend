import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

// Labeled text input with focus highlight, optional leading icon and error text.
export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  style,
  onBlur,
  multiline,
  ...rest
}) {
  const { colors, radius } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.danger
    : focused
    ? colors.primary
    : colors.border;

  const iconColor = error ? colors.danger : focused ? colors.primary : colors.textMuted;

  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "500", marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          minHeight: multiline ? 90 : 50,
          borderWidth: 1.5,
          borderColor,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
        }}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color={iconColor}
            style={{ marginRight: 8, marginTop: multiline ? 2 : 0 }}
          />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          // The container View draws the border; strip the inner TextInput's own
          // native border + web focus outline so we don't get a black box on web.
          underlineColorAndroid="transparent"
          style={{
            flex: 1,
            color: colors.text,
            fontSize: 15,
            paddingVertical: 0,
            borderWidth: 0,
            outlineStyle: "none",
            outlineWidth: 0,
          }}
          {...rest}
        />
      </View>
      {error ? (
        <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}

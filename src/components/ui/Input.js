import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
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
  secureTextEntry,
  ...rest
}) {
  const { colors, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  // Show/hide toggle for password fields. Only active when secureTextEntry is set.
  const [hidden, setHidden] = useState(true);

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
          secureTextEntry={secureTextEntry && hidden}
          // Android multiline defaults to vertically-centered text, which looks
          // broken in a tall box — force it to start at the top (web/iOS already do).
          textAlignVertical={multiline ? "top" : "center"}
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
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <MaterialCommunityIcons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={18}
              color={iconColor}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? (
        <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}

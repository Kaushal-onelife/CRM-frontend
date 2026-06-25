import React from "react";
import { Text, ActivityIndicator, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { tap } from "../../utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Variants resolve to {bg, fg, border} against the live theme.
function useVariantStyle(variant, colors) {
  switch (variant) {
    case "secondary":
      return { bg: "transparent", fg: colors.text, border: colors.border };
    case "danger":
      return { bg: colors.danger, fg: colors.onPrimary, border: "transparent" };
    case "success":
      return { bg: colors.success, fg: colors.onPrimary, border: "transparent" };
    case "ghost":
      return { bg: colors.primarySoft, fg: colors.primary, border: "transparent" };
    case "primary":
    default:
      return { bg: colors.primary, fg: colors.onPrimary, border: "transparent" };
  }
}

const SIZE = {
  sm: { h: 40, px: 14, font: 14, icon: 16 },
  md: { h: 50, px: 18, font: 15, icon: 18 },
  lg: { h: 56, px: 22, font: 16, icon: 20 },
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  fullWidth = true,
  haptic = true,
  style,
  textColor, // overrides the variant's foreground (icon + text) color
}) {
  const { colors, radius } = useTheme();
  const v = useVariantStyle(variant, colors);
  // Allow callers to recolor the foreground (e.g. soft-tinted buttons that need
  // colored text/icon instead of the variant's default white).
  if (textColor) v.fg = textColor;
  const s = SIZE[size] || SIZE.md;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 90 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      onPress={() => {
        if (isDisabled) return;
        if (haptic) tap();
        onPress?.();
      }}
      disabled={isDisabled}
      style={[
        animStyle,
        {
          height: s.h,
          paddingHorizontal: s.px,
          borderRadius: radius.md,
          backgroundColor: v.bg,
          borderWidth: v.border === "transparent" ? 0 : 1,
          borderColor: v.border,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          alignSelf: fullWidth ? "stretch" : "flex-start",
          opacity: isDisabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {icon ? (
            <MaterialCommunityIcons
              name={icon}
              size={s.icon}
              color={v.fg}
              style={{ marginRight: title ? 8 : 0 }}
            />
          ) : null}
          {title ? (
            <Text style={{ color: v.fg, fontSize: s.font, fontWeight: "600" }}>
              {title}
            </Text>
          ) : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

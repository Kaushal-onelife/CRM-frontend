import React from "react";
import { View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";
import { tap } from "../../utils/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A surface container. Pass `onPress` to make it a tappable card with a subtle
// press animation; omit it for a static panel. `accent` adds a colored left bar.
export default function Card({
  children,
  onPress,
  accent,
  padded = true,
  elevated = true,
  haptic = false,
  style,
}) {
  const { colors, radius, elevation } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const base = {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: padded ? 16 : 0,
    ...(elevated ? elevation("md") : {}),
    ...(accent
      ? { borderLeftWidth: 4, borderLeftColor: accent }
      : {}),
    overflow: "hidden",
  };

  if (!onPress) {
    return <View style={[base, style]}>{children}</View>;
  }

  return (
    <AnimatedPressable
      onPressIn={() => (scale.value = withTiming(0.98, { duration: 90 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 120 }))}
      onPress={() => {
        if (haptic) tap();
        onPress();
      }}
      style={[animStyle, base, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

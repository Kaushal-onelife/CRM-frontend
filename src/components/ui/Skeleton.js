import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "../../context/ThemeContext";

// A single shimmering placeholder block.
export function Skeleton({ width = "100%", height = 16, radius: r, style }) {
  const { colors, radius } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1000 }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.4, 0.85]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: r ?? radius.sm,
          backgroundColor: colors.divider,
        },
        animStyle,
        style,
      ]}
    />
  );
}

// A ready-made skeleton shaped like a list card — drop into list/dashboard loading.
export function SkeletonCard() {
  const { colors, radius } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Skeleton width={44} height={44} radius={22} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton width="60%" height={14} />
        <View style={{ height: 8 }} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export default Skeleton;

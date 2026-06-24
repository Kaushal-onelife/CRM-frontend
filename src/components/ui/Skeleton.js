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

// A ready-made skeleton shaped like a list row (icon/avatar + 2 lines + trailing
// value) — mirrors the real list cards (Customers, Services, Bills, AMC).
export function SkeletonCard() {
  const { colors, radius, elevation } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: radius.lg,
          padding: 16,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
        },
        elevation("sm"),
      ]}
    >
      <Skeleton width={44} height={44} radius={radius.md} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton width="55%" height={15} />
        <View style={{ height: 8 }} />
        <Skeleton width="35%" height={12} />
      </View>
      {/* trailing value (amount/date) like the real rows */}
      <Skeleton width={48} height={14} />
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

// Skeleton shaped like the Dashboard: greeting, gradient hero, 2x2 stat grid,
// then a section of service rows — so there's no layout jump when data loads.
export function SkeletonDashboard() {
  const { colors, radius, elevation } = useTheme();
  return (
    <View>
      {/* Greeting */}
      <Skeleton width="35%" height={13} style={{ marginTop: 10 }} />
      <Skeleton width="55%" height={24} style={{ marginTop: 8 }} />

      {/* Hero card */}
      <Skeleton width="100%" height={120} radius={18} style={{ marginTop: 16 }} />

      {/* 2x2 stat grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            style={[
              {
                width: "47%",
                backgroundColor: colors.card,
                borderRadius: radius.lg,
                padding: 16,
                marginBottom: 12,
              },
              elevation("sm"),
            ]}
          >
            <Skeleton width={40} height={40} radius={radius.md} />
            <Skeleton width="50%" height={22} style={{ marginTop: 14 }} />
            <Skeleton width="70%" height={12} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>

      {/* Section title + a couple of service rows */}
      <Skeleton width="40%" height={16} style={{ marginTop: 8, marginBottom: 12 }} />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

export default Skeleton;

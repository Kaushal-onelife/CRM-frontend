import React from "react";
import { View, Text, StyleSheet, RefreshControl, Pressable, SectionList } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationAPI } from "../../services/api";
import { Card, EmptyState, SkeletonList, useToast } from "../../components/ui";
import { useTheme } from "../../context/ThemeContext";
import { navigateToDeepLink } from "../../utils/notificationNav";

// Category -> icon + tone. Keeps the inbox scannable at a glance.
const CATEGORY_META = {
  money: { icon: "cash-multiple", tone: "success" },
  service: { icon: "wrench-outline", tone: "primary" },
  amc: { icon: "file-document-outline", tone: "warning" },
  inventory: { icon: "package-variant-closed", tone: "warning" },
  reminder: { icon: "bell-ring-outline", tone: "primary" },
  system: { icon: "information-outline", tone: "textSecondary" },
};

// Relative "time ago" from an ISO timestamp — light, no dependency.
function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function NotificationRow({ item, index, colors, onPress }) {
  const meta = CATEGORY_META[item.category] || CATEGORY_META.system;
  const toneColor = colors[meta.tone] || colors.textSecondary;
  const unread = !item.read_at;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 35).duration(260)}>
      <Card
        onPress={() => onPress(item)}
        haptic
        style={{
          marginBottom: 10,
          borderLeftWidth: unread ? 3 : 0,
          borderLeftColor: unread ? colors.primary : "transparent",
        }}
      >
        <View style={{ flexDirection: "row" }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <MaterialCommunityIcons name={meta.icon} size={20} color={toneColor} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 14,
                  fontWeight: unread ? "700" : "600",
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {unread && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.primary,
                    marginLeft: 6,
                  }}
                />
              )}
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6 }}>
              {timeAgo(item.sent_at)}
            </Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, error, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationAPI.list("limit=50"),
  });

  const markRead = useMutation({
    mutationFn: (id) => notificationAPI.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
      toast.success("All marked as read");
    },
  });

  const handlePress = (item) => {
    if (!item.read_at) markRead.mutate(item.id);
    if (item.deep_link) navigateToDeepLink(navigation, item.deep_link);
  };

  const items = data?.notifications || [];
  const hasUnread = items.some((n) => !n.read_at);

  // "Mark all read" action in the header.
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        hasUnread ? (
          <Pressable onPress={() => markAll.mutate()} hitSlop={8} style={{ marginRight: 14 }}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>
              Mark all read
            </Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, hasUnread, colors.primary]);

  if (isLoading && !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonList count={6} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}>
        <EmptyState
          tone="error"
          icon="cloud-off-outline"
          title="Couldn't load notifications"
          message={error.message || "Please try again."}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, flex: 1 }]}>
        <View style={{ flex: 1, marginTop: 40 }}>
          <EmptyState
            icon="bell-check-outline"
            title="You're all caught up"
            message="New payments, due services, and AMC alerts will show up here."
          />
        </View>
      </View>
    );
  }

  // Split into "New" (unread) and "Earlier" (read) so fresh items stand out.
  // Empty sections are dropped so their headers don't render.
  const sections = [
    { title: "New", data: items.filter((n) => !n.read_at) },
    { title: "Earlier", data: items.filter((n) => n.read_at) },
  ].filter((s) => s.data.length > 0);

  return (
    <SectionList
      style={[styles.container, { backgroundColor: colors.background }]}
      sections={sections}
      keyExtractor={(n) => n.id}
      renderItem={({ item, index }) => (
        <NotificationRow item={item} index={index} colors={colors} onPress={handlePress} />
      )}
      renderSectionHeader={({ section }) => (
        <Text style={[styles.sectionHeader, { color: colors.textSecondary, backgroundColor: colors.background }]}>
          {section.title}
        </Text>
      )}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} tintColor={colors.primary} onRefresh={() => refetch()} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingTop: 12,
    paddingBottom: 6,
  },
});

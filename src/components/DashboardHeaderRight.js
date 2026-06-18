import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "../context/ThemeContext";
import { useProfile } from "../hooks/useProfile";
import { reminderAPI } from "../services/api";

// Header-right cluster for the Dashboard: a bell with the reminder count
// (-> Reminders) and the user's avatar (-> Settings). Both reuse shared query
// caches so they don't add extra fetches.
export default function DashboardHeaderRight({ navigation }) {
  const { colors } = useTheme();
  const { data: profile } = useProfile();

  const { data: reminders } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => reminderAPI.get(),
  });
  const count = reminders?.counts?.total || 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginRight: 14, gap: 14 }}>
      {/* Bell -> Reminders */}
      <Pressable
        onPress={() => navigation.navigate("More", { screen: "Reminders" })}
        hitSlop={8}
      >
        <MaterialCommunityIcons name="bell-outline" size={24} color={colors.text} />
        {count > 0 && (
          <View
            style={{
              position: "absolute",
              top: -5,
              right: -6,
              minWidth: 17,
              height: 17,
              borderRadius: 9,
              paddingHorizontal: 3,
              backgroundColor: colors.danger,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
              {count > 9 ? "9+" : count}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Avatar -> Settings */}
      <Pressable onPress={() => navigation.navigate("More", { screen: "Settings" })} hitSlop={8}>
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primaryLight }}
          />
        ) : (
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: colors.primaryLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
              {profile?.name?.charAt(0)?.toUpperCase() || "?"}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

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

      {/* Avatar -> Settings. Simple solid brand ring with a white gap so it's
          clearly visible around the avatar. */}
      <Pressable onPress={() => navigation.navigate("More", { screen: "Settings" })} hitSlop={8}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryLight }}
            />
          ) : (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
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
        </View>
      </Pressable>
    </View>
  );
}

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "../../services/supabase";
import { useTheme } from "../../context/ThemeContext";

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme, theme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data } = await supabase
          .from("users")
          .select("*, tenants(*)")
          .eq("id", authUser.id)
          .single();
        setUser(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const MenuTile = ({ label, icon, subtitle, onPress, color = colors.primary, rightElement }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 mb-3 rounded-2xl border"
      style={{
        backgroundColor: colors.card,
        borderColor: isDark ? "#374151" : "#F3F4F6",
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold" style={{ color: colors.text }}>
          {label}
        </Text>
        {subtitle && (
          <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView 
        className="flex-1" 
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
    >
      <View className="p-6 items-center">
        <View 
            className="w-24 h-24 rounded-full items-center justify-center mb-4 border-4"
            style={{ 
                backgroundColor: `${colors.primary}10`,
                borderColor: `${colors.primary}30`
            }}
        >
          <Text className="text-3xl font-black" style={{ color: colors.primary }}>
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
        <Text className="text-2xl font-black tracking-tight" style={{ color: colors.text }}>
          {user?.name || "User Name"}
        </Text>
        <View className="flex-row items-center mt-1">
            <MaterialCommunityIcons name="shield-check" size={14} color="#10B981" style={{ marginRight: 4 }} />
            <Text className="text-sm font-bold capitalize" style={{ color: colors.textSecondary }}>
            {user?.role || "Team Member"}
            </Text>
        </View>
      </View>

      <View className="px-5">
        <Text className="text-xs font-black uppercase tracking-widest mb-4 px-1" style={{ color: colors.textSecondary }}>
            Business Context
        </Text>
        <View className="p-5 rounded-3xl border mb-6" style={{ backgroundColor: colors.card, borderColor: isDark ? "#374151" : "#F3F4F6" }}>
            <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3">
                    <MaterialCommunityIcons name="office-building" size={20} color="white" />
                </View>
                <View>
                    <Text className="text-sm font-black" style={{ color: colors.text }}>{user?.tenants?.business_name || "Nexus Pro"}</Text>
                    <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>Subscription Active</Text>
                </View>
            </View>
            <View className="flex-row justify-between pt-4 border-t" style={{ borderColor: isDark ? "#374151" : "#F3F4F6" }}>
                <View className="items-center">
                    <Text className="text-sm font-black" style={{ color: colors.text }}>Premium</Text>
                    <Text className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: colors.textSecondary }}>Plan</Text>
                </View>
                <View className="items-center">
                    <Text className="text-sm font-black" style={{ color: colors.text }}>99.9%</Text>
                    <Text className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: colors.textSecondary }}>Uptime</Text>
                </View>
                <View className="items-center">
                    <Text className="text-sm font-black" style={{ color: colors.text }}>Live</Text>
                    <Text className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: colors.textSecondary }}>Sync</Text>
                </View>
            </View>
        </View>

        <Text className="text-xs font-black uppercase tracking-widest mb-4 px-1" style={{ color: colors.textSecondary }}>
            Preferences
        </Text>
        <MenuTile 
          label="App Theme" 
          icon={isDark ? "moon-waning-crescent" : "white-balance-sunny"} 
          subtitle={isDark ? "Dark Appearance" : "Light Appearance"}
          onPress={toggleTheme}
          color="#8B5CF6"
          rightElement={
            <View className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex-row items-center px-1">
                <View className={`w-4 h-4 rounded-full ${isDark ? 'translate-x-4 bg-primary' : 'bg-white'}`} />
            </View>
          }
        />
        <MenuTile 
          label="Notifications" 
          icon="bell-outline" 
          subtitle="Manage alerts and reminders"
        />
        
        <Text className="text-xs font-black uppercase tracking-widest mt-4 mb-4 px-1" style={{ color: colors.textSecondary }}>
            Support & Info
        </Text>
        <MenuTile 
          label="Help Center" 
          icon="help-circle-outline" 
          subtitle="Guides and tutorial videos"
          color="#10B981"
        />
        <MenuTile 
          label="Terms of Service" 
          icon="file-document-outline"
          color="#F59E0B"
        />
        <MenuTile 
          label="App Version" 
          icon="information-outline" 
          subtitle="v1.0.0 (Latest)"
          color="#6B7280"
          rightElement={<View/>}
        />

        <TouchableOpacity 
            className="flex-row items-center justify-center p-4 mt-6 mb-10 rounded-2xl border"
            style={{ backgroundColor: `${colors.danger}10`, borderColor: `${colors.danger}30` }}
            onPress={handleLogout}
        >
            <MaterialCommunityIcons name="logout-variant" size={20} color={colors.danger} style={{ marginRight: 8 }} />
            <Text className="font-black" style={{ color: colors.danger }}>Sign Out from Device</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

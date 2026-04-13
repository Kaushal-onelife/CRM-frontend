import React from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

/**
 * Enhanced premium header component for all list/main screens.
 */
export default function AppHeader({
  title,
  subtitle,
  rightIcon,
  onRightPress,
  rightLabel,
  showBack = false,
  onBackPress,
}) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 15,
        paddingBottom: 22,
        backgroundColor: colors.background,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <View className="flex-row items-center mb-1">
            {showBack && onBackPress && (
              <TouchableOpacity 
                onPress={onBackPress}
                className="mr-3 p-1 rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
            {subtitle && (
              <View className="flex-row items-center">
                 <View className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }} />
                 <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "900",
                    letterSpacing: 1.8,
                    textTransform: "uppercase",
                    color: colors.textSecondary,
                  }}
                >
                  {subtitle}
                </Text>
              </View>
            )}
          </View>
          
          <Text
            style={{
              fontSize: 32,
              fontWeight: "900",
              color: colors.text,
              letterSpacing: -1.2,
              lineHeight: 38,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {rightIcon && onRightPress && (
          <TouchableOpacity
            onPress={onRightPress}
            activeOpacity={0.8}
            className="rounded-2xl items-center justify-center"
            style={{
              backgroundColor: colors.primary,
              minWidth: 46,
              height: 46,
              paddingHorizontal: rightLabel ? 16 : 0,
              flexDirection: "row",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <MaterialCommunityIcons name={rightIcon} size={20} color="#FFFFFF" />
            {rightLabel && (
              <Text
                className="ml-2 font-black text-xs tracking-tight text-white"
              >
                {rightLabel}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Decorative subtle underline/accent */}
      <View 
        className="h-1 w-12 rounded-full mt-3" 
        style={{ backgroundColor: `${colors.primary}15` }} 
      />
    </View>
  );
}

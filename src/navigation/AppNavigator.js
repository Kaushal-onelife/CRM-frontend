import React from "react";
import { View, Text, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

// Screens
import DashboardScreen from "../screens/Dashboard/DashboardScreen";
import CustomerListScreen from "../screens/Customers/CustomerListScreen";
import AddCustomerScreen from "../screens/Customers/AddCustomerScreen";
import CustomerDetailScreen from "../screens/Customers/CustomerDetailScreen";
import EditCustomerScreen from "../screens/Customers/EditCustomerScreen";
import ServiceListScreen from "../screens/Services/ServiceListScreen";
import AddServiceScreen from "../screens/Services/AddServiceScreen";
import ServiceDetailScreen from "../screens/Services/ServiceDetailScreen";
import BillListScreen from "../screens/Bills/BillListScreen";
import BillDetailScreen from "../screens/Bills/BillDetailScreen";
import CreateBillScreen from "../screens/Bills/CreateBillScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";

const Tab = createBottomTabNavigator();
const CustomerStack = createNativeStackNavigator();
const ServiceStack = createNativeStackNavigator();
const BillStack = createNativeStackNavigator();

const HEADER_THEME = (colors) => ({
  headerStyle: {
    backgroundColor: colors.background,
  },
  headerShadowVisible: false,
  headerTitleStyle: {
    fontWeight: "800",
    color: colors.text,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  headerTintColor: colors.primary,
  headerBackTitleVisible: false,
});

function CustomerNavigator() {
  const { colors } = useTheme();
  return (
    <CustomerStack.Navigator screenOptions={HEADER_THEME(colors)}>
      <CustomerStack.Screen
        name="CustomerList"
        component={CustomerListScreen}
        options={{ headerShown: false }}
      />
      <CustomerStack.Screen
        name="AddCustomer"
        component={AddCustomerScreen}
        options={{ title: "New Customer" }}
      />
      <CustomerStack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={({ route }) => ({
          title: route.params?.name || "Customer",
        })}
      />
      <CustomerStack.Screen
        name="EditCustomer"
        component={EditCustomerScreen}
        options={{ title: "Edit Details" }}
      />
      <CustomerStack.Screen
        name="AddService"
        component={AddServiceScreen}
        options={{ title: "New Service" }}
      />
    </CustomerStack.Navigator>
  );
}

function ServiceNavigator() {
  const { colors } = useTheme();
  return (
    <ServiceStack.Navigator screenOptions={HEADER_THEME(colors)}>
      <ServiceStack.Screen
        name="ServiceList"
        component={ServiceListScreen}
        options={{ headerShown: false }}
      />
      <ServiceStack.Screen
        name="AddService"
        component={AddServiceScreen}
        options={{ title: "New Service" }}
      />
      <ServiceStack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{ title: "Job Details" }}
      />
    </ServiceStack.Navigator>
  );
}

function BillNavigator() {
  const { colors } = useTheme();
  return (
    <BillStack.Navigator screenOptions={HEADER_THEME(colors)}>
      <BillStack.Screen
        name="BillList"
        component={BillListScreen}
        options={{ headerShown: false }}
      />
      <BillStack.Screen
        name="BillDetail"
        component={BillDetailScreen}
        options={{ title: "Invoice Details" }}
      />
      <BillStack.Screen
        name="CreateBill"
        component={CreateBillScreen}
        options={{ title: "Generate Invoice" }}
      />
    </BillStack.Navigator>
  );
}

const TABS = [
  { name: "Dashboard",  label: "Home",      active: "home-variant",   inactive: "home-variant-outline" },
  { name: "Customers",  label: "Clients",   active: "account-group",  inactive: "account-group-outline" },
  { name: "Services",   label: "Services",  active: "hammer-wrench",  inactive: "wrench-outline" },
  { name: "Bills",      label: "Invoices",  active: "text-box-check", inactive: "text-box-outline" },
  { name: "Settings",   label: "Settings",  active: "cog",            inactive: "cog-outline" },
];

// Fixed tab bar height so screens know how to pad their content
export const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 90 : 80;

export default function AppNavigator() {
  const { isDark, colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS.find((t) => t.name === route.name) || TABS[0];
        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#2563EB",
          tabBarInactiveTintColor: isDark ? "#6B7280" : "#94A3B8",
          tabBarStyle: {
            backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
            borderTopWidth: 0,
            // Straight bottom tab (no float) — removes the overlap bug
            height: Platform.OS === "ios" ? 82 : 68,
            paddingBottom: Platform.OS === "ios" ? 28 : 10,
            paddingTop: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: isDark ? 0.4 : 0.07,
            shadowRadius: 16,
            elevation: 16,
            // Subtle top separator line
            borderTopWidth: 1,
            borderTopColor: isDark ? "#262640" : "#F1F5F9",
          },
          tabBarIcon: ({ focused, color }) => {
            const iconName = focused ? tab.active : tab.inactive;
            return (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  width: 52,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: focused
                    ? isDark ? "#2563EB22" : "#EFF6FF"
                    : "transparent",
                }}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={22}
                  color={focused ? "#2563EB" : color}
                />
              </View>
            );
          },
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={{
                fontSize: 10,
                fontWeight: focused ? "700" : "500",
                color: focused ? "#2563EB" : color,
                marginTop: 1,
                letterSpacing: 0.2,
              }}
            >
              {tab.label}
            </Text>
          ),
        };
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Customers" component={CustomerNavigator} />
      <Tab.Screen name="Services"  component={ServiceNavigator} />
      <Tab.Screen name="Bills"     component={BillNavigator} />
      <Tab.Screen name="Settings"  component={SettingsScreen} />
    </Tab.Navigator>
  );
}

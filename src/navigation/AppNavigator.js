import React from "react";
import { View, Platform } from "react-native";
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
import CompleteServiceScreen from "../screens/Services/CompleteServiceScreen";
import ServiceSuccessScreen from "../screens/Services/ServiceSuccessScreen";
import BillListScreen from "../screens/Bills/BillListScreen";
import BillDetailScreen from "../screens/Bills/BillDetailScreen";
import CreateBillScreen from "../screens/Bills/CreateBillScreen";
import AMCListScreen from "../screens/AMC/AMCListScreen";
import AMCDetailScreen from "../screens/AMC/AMCDetailScreen";
import CreateAMCScreen from "../screens/AMC/CreateAMCScreen";
import InventoryScreen from "../screens/Inventory/InventoryScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import MoreScreen from "../screens/More/MoreScreen";

const Tab = createBottomTabNavigator();
const CustomerStack = createNativeStackNavigator();
const ServiceStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

// Shared native-stack header styling — keeps every stack header theme-aware
// (white in light mode, dark surface in dark mode) without repeating options.
function useStackScreenOptions() {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: "700", color: colors.text },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
  };
}

function CustomerNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <CustomerStack.Navigator screenOptions={screenOptions}>
      <CustomerStack.Screen
        name="CustomerList"
        component={CustomerListScreen}
        options={{ title: "Customers" }}
      />
      <CustomerStack.Screen
        name="AddCustomer"
        component={AddCustomerScreen}
        options={{ title: "Add Customer" }}
      />
      <CustomerStack.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        options={({ route }) => ({ title: route.params?.name || "Customer" })}
      />
      <CustomerStack.Screen
        name="EditCustomer"
        component={EditCustomerScreen}
        options={{ title: "Edit Customer" }}
      />
      <CustomerStack.Screen
        name="AddService"
        component={AddServiceScreen}
        options={{ title: "Add Service" }}
      />
    </CustomerStack.Navigator>
  );
}

function ServiceNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <ServiceStack.Navigator screenOptions={screenOptions}>
      <ServiceStack.Screen
        name="ServiceList"
        component={ServiceListScreen}
        options={{ title: "Services" }}
      />
      <ServiceStack.Screen
        name="AddService"
        component={AddServiceScreen}
        options={{ title: "Add Service" }}
      />
      <ServiceStack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{ title: "Service Details" }}
      />
      <ServiceStack.Screen
        name="CompleteService"
        component={CompleteServiceScreen}
        options={{ title: "Complete Service" }}
      />
      <ServiceStack.Screen
        name="ServiceSuccess"
        component={ServiceSuccessScreen}
        options={{ title: "Service Completed", headerBackVisible: false }}
      />
    </ServiceStack.Navigator>
  );
}

// The "More" tab consolidates all secondary features into one stack whose root
// is a clean menu screen. Keeps the bottom bar to 4 focused tabs while keeping
// everything one tap away (nothing hidden behind a gesture).
function MoreNavigator() {
  const screenOptions = useStackScreenOptions();
  return (
    <MoreStack.Navigator screenOptions={screenOptions}>
      <MoreStack.Screen name="MoreMenu" component={MoreScreen} options={{ title: "More" }} />

      {/* Bills */}
      <MoreStack.Screen name="Bills" component={BillListScreen} options={{ title: "Bills" }} />
      <MoreStack.Screen name="BillDetail" component={BillDetailScreen} options={{ title: "Bill Details" }} />
      <MoreStack.Screen name="CreateBill" component={CreateBillScreen} options={{ title: "Create Bill" }} />

      {/* AMC */}
      <MoreStack.Screen name="AMC" component={AMCListScreen} options={{ title: "AMC Contracts" }} />
      <MoreStack.Screen name="AMCDetail" component={AMCDetailScreen} options={{ title: "AMC Details" }} />
      <MoreStack.Screen name="CreateAMC" component={CreateAMCScreen} options={{ title: "New AMC Contract" }} />

      {/* Inventory */}
      <MoreStack.Screen name="Inventory" component={InventoryScreen} options={{ title: "Parts Inventory" }} />

      {/* Settings */}
      <MoreStack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </MoreStack.Navigator>
  );
}

const TAB_ICONS = {
  Dashboard: { active: "view-dashboard", inactive: "view-dashboard-outline" },
  Customers: { active: "account-group", inactive: "account-group-outline" },
  Services: { active: "wrench", inactive: "wrench-outline" },
  More: { active: "dots-horizontal-circle", inactive: "dots-horizontal-circle-outline" },
};

export default function AppNavigator() {
  const { isDark, colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          const iconSet = TAB_ICONS[route.name] || TAB_ICONS.Dashboard;
          const iconName = focused ? iconSet.active : iconSet.inactive;
          return (
            <View
              style={
                focused
                  ? {
                      backgroundColor: colors.primarySoft,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 4,
                    }
                  : undefined
              }
            >
              <MaterialCommunityIcons
                name={iconName}
                size={24}
                color={color}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: true,
          headerTitle: "Water Purifier CRM",
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { fontWeight: "700", color: colors.text },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomerNavigator}
        options={{ tabBarLabel: "Customers" }}
      />
      <Tab.Screen
        name="Services"
        component={ServiceNavigator}
        options={{ tabBarLabel: "Services" }}
      />
      <Tab.Screen
        name="More"
        component={MoreNavigator}
        options={{ tabBarLabel: "More" }}
      />
    </Tab.Navigator>
  );
}

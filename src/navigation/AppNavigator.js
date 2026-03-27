import React from "react";
import { View, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { COLORS } from "../constants/theme";

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
import SettingsScreen from "../screens/Settings/SettingsScreen";

const Tab = createBottomTabNavigator();
const CustomerStack = createNativeStackNavigator();
const ServiceStack = createNativeStackNavigator();
const BillStack = createNativeStackNavigator();

function CustomerNavigator() {
  return (
    <CustomerStack.Navigator>
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
  return (
    <ServiceStack.Navigator>
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

function BillNavigator() {
  return (
    <BillStack.Navigator>
      <BillStack.Screen
        name="BillList"
        component={BillListScreen}
        options={{ title: "Bills" }}
      />
      <BillStack.Screen
        name="BillDetail"
        component={BillDetailScreen}
        options={{ title: "Bill Details" }}
      />
      <BillStack.Screen
        name="CreateBill"
        component={CreateBillScreen}
        options={{ title: "Create Bill" }}
      />
    </BillStack.Navigator>
  );
}

const TAB_ICONS = {
  Dashboard: { active: "view-dashboard", inactive: "view-dashboard-outline" },
  Customers: { active: "account-group", inactive: "account-group-outline" },
  Services: { active: "wrench", inactive: "wrench-outline" },
  Bills: { active: "receipt", inactive: "text-box-outline" },
  Settings: { active: "cog", inactive: "cog-outline" },
};

export default function AppNavigator() {
  const { isDark, colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: isDark ? "#6B7280" : "#9CA3AF",
        tabBarStyle: {
          backgroundColor: isDark ? colors.card : "#FFFFFF",
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
                      backgroundColor: isDark ? "#1E3A5F" : "#EFF6FF",
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
        name="Bills"
        component={BillNavigator}
        options={{ tabBarLabel: "Bills" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: true,
          headerTitle: "Settings",
          tabBarLabel: "Settings",
        }}
      />
    </Tab.Navigator>
  );
}

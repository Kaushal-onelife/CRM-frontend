// Single source of truth for turning a notification's deep_link into a
// navigation action. Used by both the push tap-handler (RootNavigator) and the
// in-app Notification Center list, so routing logic lives in one place.
//
// deep_link shape (set by the backend): { screen, params }
//   screen: "Services" | "Bills" | "AMC" | "Reminders" | "Inventory" |
//           "Customers" | "Dashboard"
//   params: e.g. { id } for detail screens
//
// Note the tab/stack structure:
//   - Services/Customers are their own tabs with detail routes inside.
//   - Bills/AMC/Reminders/Inventory live INSIDE the "More" tab's stack.

const MORE_STACK_SCREENS = {
  Bills: "BillDetail",
  AMC: "AMCDetail",
  Reminders: "Reminders",
  Inventory: "Inventory",
};

// navigation: a React Navigation navigator (root or any that can reach tabs).
export function navigateToDeepLink(navigation, deepLink) {
  if (!navigation || !deepLink || !deepLink.screen) return;
  const { screen, params } = deepLink;

  switch (screen) {
    case "Services":
      // Services tab -> ServiceDetail
      navigation.navigate("Services", { screen: "ServiceDetail", params });
      return;
    case "Customers":
      navigation.navigate("Customers", { screen: "CustomerDetail", params });
      return;
    case "Bills":
      navigation.navigate("More", { screen: "BillDetail", params });
      return;
    case "AMC":
      navigation.navigate("More", { screen: "AMCDetail", params });
      return;
    case "Reminders":
      navigation.navigate("More", { screen: "Reminders" });
      return;
    case "Inventory":
      navigation.navigate("More", { screen: "Inventory" });
      return;
    case "Dashboard":
      navigation.navigate("Dashboard");
      return;
    default:
      // Fallback: try a More-stack screen, else Notifications inbox.
      if (MORE_STACK_SCREENS[screen]) {
        navigation.navigate("More", { screen: MORE_STACK_SCREENS[screen], params });
      }
  }
}

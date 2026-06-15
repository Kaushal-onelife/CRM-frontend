// Optional haptics — works if `expo-haptics` is installed, no-ops otherwise.
// Install later with: npx expo install expo-haptics
let Haptics = null;
try {
  // eslint-disable-next-line global-require
  Haptics = require("expo-haptics");
} catch (e) {
  Haptics = null;
}

export const tap = () => {
  Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light);
};

export const success = () => {
  Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
};

export const warning = () => {
  Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Warning);
};

export const error = () => {
  Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Error);
};

export default { tap, success, warning, error };

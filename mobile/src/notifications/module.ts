import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

export type NotificationsApi = typeof import("expo-notifications");

let cached: NotificationsApi | null | undefined;

export function getNotifications(): NotificationsApi | null {
  if (cached !== undefined) {
    return cached;
  }

  // Expo Go does not ship ExpoTopicSubscriptionModule (Android, SDK 53+).
  // Requiring expo-notifications there crashes before any JS try/catch can help.
  if (Platform.OS === "web" || isRunningInExpoGo()) {
    cached = null;
    return cached;
  }

  try {
    const Notifications = require("expo-notifications") as NotificationsApi;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    cached = Notifications;
  } catch {
    cached = null;
  }

  return cached;
}

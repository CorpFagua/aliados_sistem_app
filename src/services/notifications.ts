import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


export async function registerPushToken() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return null;

  const { data: token } = await Notifications.getDevicePushTokenAsync();

  return {
    token,
    platform: Platform.OS,
  };
}


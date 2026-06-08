import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import {Platform} from "react-native";
import {Logger} from "@/src/utils/logger";

export async function registerForPushNotificationsAsync() {
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
        });
    }

    if (!Device.isDevice) {
        Logger.warn("푸시 알림은 실제 기기에서만 동작합니다.");
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const {status} = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        Logger.warn("알림 권한이 거부되었습니다.");
        return null;
    }

    const tokenInfo = await Notifications.getDevicePushTokenAsync();

    return tokenInfo.data;
}
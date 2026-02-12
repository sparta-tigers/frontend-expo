import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";

/**
 * 푸시 알림 훅
 * Expo Notifications를 사용하여 토큰 발급 및 알림 수신 처리
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);

  useEffect(() => {
    // 푸시 알림 설정
    const setupNotifications = async () => {
      try {
        // 1. 권한 요청
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          console.log("알림 권한이 거부되었습니다.");
          return;
        }

        // 2. 토큰 발급
        if (Device.isDevice) {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;

          if (!projectId) {
            console.warn(
              "EAS Project ID를 찾을 수 없습니다. app.json을 확인하세요.",
            );
            return;
          }

          const token = await Notifications.getExpoPushTokenAsync({
            projectId,
          });

          setExpoPushToken(token.data);
          console.log("Expo Push Token:", token.data);
        } else {
          console.log("실제 기기가 아닙니다.");
        }

        // 3. 채널 설정 (Android)
        if (Device.osName === "Android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            sound: "default",
          });
        }

        // 4. 리스너 등록
        const subscription1 = Notifications.addNotificationReceivedListener(
          (notification) => {
            console.log("알림 수신:", notification);
            setNotification(notification);
          },
        );

        const subscription2 =
          Notifications.addNotificationResponseReceivedListener((response) => {
            console.log("알림 응답:", response);
            // TODO: 알림 클릭 시 처리 로직 추가
          });

        return () => {
          subscription1.remove();
          subscription2.remove();
        };
      } catch (error) {
        console.error("푸시 알림 설정 에러:", error);
      }
    };

    const cleanup = setupNotifications();
    return cleanup;
  }, []);

  return {
    expoPushToken,
    notification,
  };
}

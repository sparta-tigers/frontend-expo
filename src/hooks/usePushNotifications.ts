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
    let notificationListener: Notifications.Subscription | undefined;
    let responseListener: Notifications.Subscription | undefined;

    // 권한 요청 및 토큰 발급 비동기 함수
    const registerForPushNotificationsAsync = async () => {
      try {
        // 1. 권한 요청
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          console.log("알림 권한이 거부되었습니다.");
          return null;
        }

        // 2. 토큰 발급
        if (Device.isDevice) {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;

          if (!projectId) {
            console.warn(
              "EAS Project ID를 찾을 수 없습니다. app.json을 확인하세요.",
            );
            return null;
          }

          const token = await Notifications.getExpoPushTokenAsync({
            projectId,
          });

          return token.data;
        } else {
          console.log("실제 기기가 아닙니다.");
          return null;
        }
      } catch (error) {
        console.error("푸시 알림 설정 에러:", error);
        return null;
      }
    };

    // 비동기 함수 실행 및 토큰 설정
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        console.log("Expo Push Token:", token);
      }
    });

    // 채널 설정 (Android)
    const setupNotificationChannel = async () => {
      if (Device.osName === "Android") {
        try {
          await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            sound: "default",
          });
        } catch (error) {
          console.error("알림 채널 설정 에러:", error);
        }
      }
    };

    setupNotificationChannel();

    // 리스너 등록
    notificationListener = Notifications.addNotificationReceivedListener(
      (receivedNotification) => {
        console.log("알림 수신:", receivedNotification);
        setNotification(receivedNotification);
      },
    );

    responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("알림 응답:", response);
        // TODO: 알림 클릭 시 처리 로직 추가
      },
    );

    // Cleanup 함수
    return () => {
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}

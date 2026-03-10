import Constants from "expo-constants";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import { apiClient } from "@/src/core/client";
import { useAuth } from "@/src/hooks/useAuth";

// 타입 정의
interface NotificationType {
  request: {
    content: {
      title: string;
      body: string;
      data?: any;
    };
  };
}

interface NotificationResponse {
  notification: NotificationType;
  actionIdentifier?: string;
}

// 안드로이드 Expo Go 환경에서 푸시 알림 임포트 방어
let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notifications = require("expo-notifications");
} catch (error) {
  console.warn("expo-notifications를 임포트할 수 없습니다:", error);
}

/**
 * 푸시 알림 훅
 * Expo Notifications를 사용하여 토큰 발급 및 알림 수신 처리
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationType | null>(
    null,
  );
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    // 안드로이드 Expo Go 환경에서는 푸시 알림 기능 스킵
    if (Platform.OS === "android" && __DEV__ && !Notifications) {
      console.log("안드로이드 Expo Go 환경: 푸시 알림 기능이 제한됩니다.");
      return;
    }

    let notificationListener: any = undefined;
    let responseListener: any = undefined;

    // 권한 요청 및 토큰 발급 비동기 함수
    const registerForPushNotificationsAsync = async () => {
      try {
        if (!Notifications) {
          console.log("푸시 알림 모듈을 사용할 수 없습니다.");
          return null;
        }

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

    // 비동기 함수 실행 및 토큰 설정 (로컬 토큰 발급만 담당)
    registerForPushNotificationsAsync().then((token) => {
      if (!token) return;

      setExpoPushToken(token);
      console.log("Expo Push Token:", token);
    });

    // 채널 설정 (Android)
    const setupNotificationChannel = async () => {
      if (Device.osName === "Android" && Notifications) {
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
    if (Notifications) {
      notificationListener = Notifications.addNotificationReceivedListener(
        (receivedNotification: NotificationType) => {
          console.log("알림 수신:", receivedNotification);
          setNotification(receivedNotification);
        },
      );

      // 🚨 앙드레 카파시: 알림 응답 리스너 (딥링킹)
      responseListener = Notifications.addNotificationResponseReceivedListener(
        (response: NotificationResponse) => {
          console.log("알림 응답:", response);

          // 🚨 앙드레 카파시: 딥링킹 처리
          const { roomId } = response.notification.request.content.data || {};
          if (roomId) {
            console.log("🔗 [Deep Link] 채팅방으로 이동:", roomId);
            router.push(`/exchange/chat/${roomId}`);
          } else {
            console.log("🔗 [Deep Link] roomId가 없어 기본 화면으로 이동");
            router.push("/(tabs)");
          }
        },
      );
    }

    // Cleanup 함수
    return () => {
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, [router]);

  // 로그인 상태 + Expo 토큰이 모두 준비된 이후에만 백엔드에 디바이스 토큰 등록
  useEffect(() => {
    const registerDeviceTokenToBackend = async () => {
      if (!expoPushToken || !isLoggedIn) return;

      try {
        const response = await apiClient.post("/api/device-tokens", {
          token: expoPushToken,
          deviceType: Device.osName ?? "UNKNOWN",
        });
        console.log("디바이스 토큰 등록 결과:", response);
      } catch (error) {
        console.error("디바이스 토큰 등록 실패:", error);
      }
    };

    void registerDeviceTokenToBackend();
  }, [expoPushToken, isLoggedIn]);

  return {
    expoPushToken,
    notification,
  };
}

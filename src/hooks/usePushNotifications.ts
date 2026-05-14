import * as Notifications from "expo-notifications";
import { Subscription } from "expo-notifications";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import { apiClient } from "@/src/core/client";
import { useAuth } from "@/src/hooks/useAuth";
import { Logger, maskSensitive } from "@/src/utils/logger";

const pushLogger = Logger.category('PUSH');



/**
 * 푸시 알림 훅
 * Expo Notifications를 사용하여 토큰 발급 및 알림 수신 처리
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(
    null,
  );
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    // 안드로이드 Expo Go 환경 예외 처리 (필요 시)
    if (Platform.OS === "android" && __DEV__) {
      // pushLogger.debug("안드로이드 개발 환경: 푸시 알림 설정을 시작합니다.");
    }

    let notificationListener: Subscription | undefined = undefined;
    let responseListener: Subscription | undefined = undefined;

    // 권한 요청 및 토큰 발급 비동기 함수
    const registerForPushNotificationsAsync = async () => {
      try {
        // 0. 가드 (Notifications는 정적 임포트되므로 항상 존재하지만, 환경에 따른 예외 처리 가능)
        if (Platform.OS === "web") {
          return null;
        }

        // 1. 권한 요청
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          pushLogger.debug("알림 권한이 거부되었습니다.");
          return null;
        }

        // 2. 토큰 발급
        if (Device.isDevice) {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;

          if (!projectId) {
            pushLogger.warn(
              "EAS Project ID를 찾을 수 없습니다. app.json을 확인하세요.",
            );
            return null;
          }

          const token = await Notifications.getExpoPushTokenAsync({
            projectId,
          });

          return token.data;
        } else {
          return null;
        }
      } catch (error) {
        pushLogger.error("푸시 알림 설정 에러", error);
        return null;
      }
    };

    const initToken = async () => {
      const token = await registerForPushNotificationsAsync();
      if (!token) return;

      setExpoPushToken(token);
      pushLogger.debug("Expo Push Token 발급 완료", maskSensitive(token));
    };

    void initToken();

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
          pushLogger.error("알림 채널 설정 에러", error);
        }
      }
    };

    void setupNotificationChannel();

    // 리스너 등록
    notificationListener = Notifications.addNotificationReceivedListener(
        (receivedNotification) => {
          pushLogger.debug("알림 수신", receivedNotification);
          setNotification(receivedNotification);
        },
      );

      // 🚨 앙드레 카파시: 알림 응답 리스너 (딥링킹)
      responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data as { roomId?: string };
          const { roomId } = data || {};
          if (roomId) {
            router.push(`/exchange/chat/${encodeURIComponent(roomId)}`);
          } else {
            router.push("/(tabs)");
          }
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
        pushLogger.debug("디바이스 토큰 등록 결과", response);
      } catch (error) {
        pushLogger.error("디바이스 토큰 등록 실패", error);
      }
    };

    void registerDeviceTokenToBackend();
  }, [expoPushToken, isLoggedIn]);

  return {
    expoPushToken,
    notification,
  };
}

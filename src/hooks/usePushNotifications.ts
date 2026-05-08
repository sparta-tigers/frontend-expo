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
      Logger.debug("안드로이드 개발 환경: 푸시 알림 설정을 시작합니다.");
    }

    let notificationListener: Subscription | undefined = undefined;
    let responseListener: Subscription | undefined = undefined;

    // 권한 요청 및 토큰 발급 비동기 함수
    const registerForPushNotificationsAsync = async () => {
      try {
        // 0. 가드 (Notifications는 정적 임포트되므로 항상 존재하지만, 환경에 따른 예외 처리 가능)
        if (Platform.OS === "web") {
          Logger.debug("웹 환경: 푸시 알림이 지원되지 않습니다.");
          return null;
        }

        // 1. 권한 요청
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          Logger.debug("알림 권한이 거부되었습니다.");
          return null;
        }

        // 2. 토큰 발급
        if (Device.isDevice) {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;

          if (!projectId) {
            Logger.warn(
              "EAS Project ID를 찾을 수 없습니다. app.json을 확인하세요.",
            );
            return null;
          }

          const token = await Notifications.getExpoPushTokenAsync({
            projectId,
          });

          return token.data;
        } else {
          Logger.debug("실제 기기가 아닙니다.");
          return null;
        }
      } catch (error) {
        Logger.error("푸시 알림 설정 에러:", error);
        return null;
      }
    };

    // 비동기 함수 실행 및 토큰 설정 (로컬 토큰 발급만 담당)
    registerForPushNotificationsAsync().then((token) => {
      if (!token) return;

      setExpoPushToken(token);
      Logger.debug("Expo Push Token:", maskSensitive(token));
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
          Logger.error("알림 채널 설정 에러:", error);
        }
      }
    };

    setupNotificationChannel();

    // 리스너 등록
    notificationListener = Notifications.addNotificationReceivedListener(
        (receivedNotification) => {
          Logger.debug("알림 수신:", receivedNotification);
          setNotification(receivedNotification);
        },
      );

      // 🚨 앙드레 카파시: 알림 응답 리스너 (딥링킹)
      responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          Logger.debug("알림 응답 수신");

          // 🚨 앙드레 카파시: 딥링킹 처리
          const data = response.notification.request.content.data as { roomId?: string };
          const { roomId } = data || {};
          if (roomId) {
            Logger.debug("🔗 [Deep Link] 채팅방으로 이동:", roomId);
            router.push(`/exchange/chat/${encodeURIComponent(roomId)}`);
          } else {
            Logger.debug("🔗 [Deep Link] roomId가 없어 기본 화면으로 이동");
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
        Logger.debug("디바이스 토큰 등록 결과:", response);
      } catch (error) {
        Logger.error("디바이스 토큰 등록 실패:", error);
      }
    };

    void registerDeviceTokenToBackend();
  }, [expoPushToken, isLoggedIn]);

  return {
    expoPushToken,
    notification,
  };
}

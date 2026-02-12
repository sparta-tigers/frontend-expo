import { useAuth } from "@/src/hooks/useAuth";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import * as Notifications from "expo-notifications";
import { Redirect, Slot, useSegments } from "expo-router";
import "fast-text-encoding";
import { ActivityIndicator, View } from "react-native";

/**
 * 루트 레이아웃
 * 전체 앱의 진입점
 */
export default function RootLayout() {
  const { user, isLoading } = useAuth();
  const { expoPushToken, notification } = usePushNotifications();
  const segments = useSegments();

  const inAuthGroup = segments[0] === "(auth)";

  // 푸시 알림 핸들러 설정
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // 토큰 발급 확인
  if (expoPushToken) {
    console.log("Expo Push Token 발급 완료:", expoPushToken);
    // TODO: 백엔드로 토큰 전송 API 연동
  }

  // 로딩 중인 경우 ActivityIndicator 표시
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 로그인되지 않은 경우: (auth) 그룹이 아닐 때만 signin으로 이동 (Redirect 루프 방지)
  if (!user && !inAuthGroup) {
    return <Redirect href="/(auth)/signin" />;
  }

  // 로그인된 경우: (auth) 그룹에 있으면 메인 탭으로 이동
  if (user && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return <Slot />;
}

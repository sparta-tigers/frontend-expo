import { CombinedProvider } from "@/components/providers/combined-provider";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import * as Notifications from "expo-notifications";
import { Redirect, Slot, useSegments } from "expo-router";
import "fast-text-encoding";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

/**
 * 루트 레이아웃
 * 전체 앱의 진입점
 */
export default function RootLayout() {
  return (
    <CombinedProvider>
      <RootLayoutInner />
    </CombinedProvider>
  );
}

/**
 * 내부 레이아웃 컴포넌트
 * AuthProvider와 ThemeProvider 내부에서 훅들을 사용하기 위한 분리
 */
function RootLayoutInner() {
  const { user, isLoading } = useAuth();
  const { expoPushToken } = usePushNotifications();
  const segments = useSegments();
  const { colors } = useTheme();

  const inAuthGroup = segments[0] === "(auth)";

  // 푸시 알림 핸들러 설정
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
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

  return (
    <SafeAreaProvider>
      {/* 1. 전역 고정 로고 레이아웃 (상단 안전 영역만 차지) */}
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: colors.background }}
      >
        <View
          style={{
            paddingVertical: 12,
            alignItems: "center",
            justifyContent: "center",
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: colors.primary,
            }}
          >
            YAGUNIV
          </Text>
        </View>
      </SafeAreaView>

      {/* 2. 하위 라우팅 화면 */}
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}

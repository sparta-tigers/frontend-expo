import { CombinedProvider } from "@/components/providers/combined-provider";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useThemeColor";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import * as Notifications from "expo-notifications";
import { router, Slot, useSegments } from "expo-router";
import "fast-text-encoding";
import { useEffect, useRef } from "react";
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
  const colors = useTheme();
  const segments = useSegments();

  // 🚨 앙드레 카파시: 네비게이터 준비 상태 추적
  const navigationReady = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // 🚨 앙드레 카파시: 네비게이터 준비 상태 관리
  useEffect(() => {
    // 네비게이션이 준비되었음을 표시
    const timer = setTimeout(() => {
      navigationReady.current = true;
      if (__DEV__) {
        console.log("🔍 [Navigation] 네비게이터 준비 완료");
      }
    }, 100); // 100ms 지연으로 안정화

    return () => {
      clearTimeout(timer);
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // 🚨 앙드레 카파시: 안전한 리디렉션 로직
  const safeRedirect = (href: string) => {
    if (!navigationReady.current) {
      // 네비게이터가 준비되지 않았으면 지연 실행
      redirectTimeoutRef.current = setTimeout(() => {
        if (__DEV__) {
          console.log("🔍 [Navigation] 지연된 리디렉션 실행:", href);
        }
        // @ts-ignore
        router.replace(href);
      }, 200);
      return;
    }

    // 네비게이터가 준비되었으면 즉시 실행
    if (__DEV__) {
      console.log("🔍 [Navigation] 즉시 리디렉션 실행:", href);
    }
    // @ts-ignore
    router.replace(href);
  };

  // 🚨 앙드레 카파시: 안전한 리디렉션 적용
  useEffect(() => {
    // 로그인되지 않은 경우: (auth) 그룹이 아닐 때만 signin으로 이동 (Redirect 루프 방지)
    if (!user && !inAuthGroup && !isLoading) {
      safeRedirect("/(auth)/signin");
    }

    // 로그인된 경우: (auth) 그룹에 있으면 메인 탭으로 이동
    if (user && inAuthGroup && !isLoading) {
      safeRedirect("/(tabs)");
    }
  }, [user, inAuthGroup, isLoading]);

  // 로딩 중인 경우 ActivityIndicator 표시
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 🚨 앙드레 카파시: 기본 렌더링 (Redirect는 useEffect에서 처리)
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "left", "right"]}
      >
        {/* 1. 고정 헤더 (SafeArea 보호) */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingVertical: 15,
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

        {/* 2. 하위 라우팅 화면 */}
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Slot />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

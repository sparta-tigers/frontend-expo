import { CombinedProvider } from "@/components/providers/combined-provider";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { ErrorBoundaryFallback } from "@/src/components/shared/ErrorBoundaryFallback";
import { OfflineBanner } from "@/src/components/shared/OfflineBanner";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";

import { Logger } from "@/src/utils/logger";
import { useNetInfo } from "@react-native-community/netinfo";
import * as Notifications from "expo-notifications";
import { Href, router, Stack, useSegments } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "@/src/styles/theme";

/**
 * 푸시 알림 핸들러 설정 (모듈 스코프)
 *
 * Why: 컴포넌트 렌더 본문에 두면 매 렌더마다 핸들러가 재설정됨.
 * 모듈 로드 시 1회만 실행되도록 컴포넌트 밖으로 이동.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});


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
  const { colors } = useTheme();
  const segments = useSegments();

  // 🚨 앙드레 카파시: 네트워크 상태 감지
  const netInfo = useNetInfo();

  // 🚨 앙드레 카파시: 네비게이터 준비 상태 추적
  const navigationReady = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inAuthGroup = segments[0] === "(auth)";

  // 토큰 발급 확인 (실제 전송 로직은 usePushNotifications 훅에서 처리)
  if (expoPushToken) {
    Logger.debug("Expo Push Token 발급 완료:", expoPushToken);
  }

  // 🚨 앙드레 카파시: 네비게이터 준비 상태 관리
  useEffect(() => {
    // 네비게이션이 준비되었음을 표시
    const timer = setTimeout(() => {
      navigationReady.current = true;
      Logger.debug("[Navigation] 네비게이터 준비 완료");
    }, 100); // 100ms 지연으로 안정화

    return () => {
      clearTimeout(timer);
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // 🚨 앙드레 카파시: 안전한 리디렉션 로직
  const safeRedirect = useCallback((href: string) => {
    if (!navigationReady.current) {
      // 네비게이터가 준비되지 않았으면 지연 실행
      redirectTimeoutRef.current = setTimeout(() => {
        Logger.debug("[Navigation] 지연된 리디렉션 실행:", href);
        router.replace(href as Href);
      }, 200);
      return;
    }

    // 네비게이터가 준비되었으면 즉시 실행
    Logger.debug("[Navigation] 즉시 리디렉션 실행:", href);
    router.replace(href as Href);
  }, []);

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
  }, [user, inAuthGroup, isLoading, safeRedirect]);

  // 로딩 중인 경우 ActivityIndicator 표시
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 🚨 앙드레 카파시: Error Boundary로 전체 앱 감싸기
  return (
    <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
      <GestureHandlerRootView style={styles.gestureContainer}>
        <SafeAreaProvider>
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: colors.background }]}
            edges={["top", "left", "right"]}
          >
            {/* 🚨 앙드레 카파시: 오프라인 배너 */}
            {!netInfo.isConnected && <OfflineBanner />}

            {/* 1. 고정 헤더 (전역) - 특정 화면에서는 숨김 처리 */}
            {!inAuthGroup && segments[0] !== "schedule" && (
              <View style={styles.topHeader}>
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.headerIconBtn}
                  onPress={() => {
                    if (router.canGoBack()) {
                      router.back();
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="뒤로가기"
                >
                  <MaterialIcons 
                    name="chevron-left" 
                    size={theme.layout.header.backIconSize} 
                    color={router.canGoBack() ? theme.colors.team.neutralDark : "transparent"} 
                  />
                </TouchableOpacity>
                
                <Text style={styles.mainTitleText}>YAGUNIV</Text>
                
                {/* 프로필 버튼 */}
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  style={styles.headerIconBtn} 
                  onPress={() => router.push("/profile")}
                  accessibilityRole="button"
                  accessibilityLabel="프로필"
                >
                  <MaterialIcons name="person-outline" size={28} color={theme.colors.team.neutralDark} />
                </TouchableOpacity>
              </View>
            )}

            {/* 2. 하위 라우팅 화면 */}
            <View
              style={[
                styles.contentContainer,
                { backgroundColor: colors.background },
              ]}
            >
              <Stack
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: true,
                  animation: "slide_from_right",
                  fullScreenGestureEnabled: true, // Android에서도 제스처 가능하도록 설정
                }}
              />
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gestureContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  headerIconBtn: {
    padding: theme.spacing.xs,
  },
  mainTitleText: {
    fontSize: theme.layout.header.titleFontSize,
    fontWeight: theme.typography.weight.black,
    color: theme.colors.brand.mint,
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
  },
});

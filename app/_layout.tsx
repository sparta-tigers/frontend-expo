import { CombinedProvider } from "@/components/providers/combined-provider";
import { Logger } from "@/src/utils/logger";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { ErrorBoundaryFallback } from "@/src/components/shared/ErrorBoundaryFallback";
import { OfflineBanner } from "@/src/components/shared/OfflineBanner";

import { useNetInfo } from "@react-native-community/netinfo";
import * as Notifications from "expo-notifications";
import { Href, router, Stack, useSegments } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/src/styles/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Box, Typography } from "@/components/ui";

import Constants, { AppOwnership } from "expo-constants";

/**
 * 푸시 알림 핸들러 설정 (모듈 스코프)
 * 🚨 앙드레 카파시: Expo Go (SDK 53+)에서는 알림 기능이 제한되므로 에러 방지 처리.
 */
if (Constants.appOwnership !== AppOwnership.Expo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    Logger.category('SYSTEM').warn("Notifications are not supported in this environment", e);
  }
}

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
 */
function RootLayoutInner() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const netInfo = useNetInfo();

  const navigationReady = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inAuthGroup = segments[0] === "(auth)";


  useEffect(() => {
    const timer = setTimeout(() => {
      navigationReady.current = true;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const safeRedirect = useCallback((href: Href) => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    if (!navigationReady.current) {
      redirectTimeoutRef.current = setTimeout(() => {
        router.replace(href);
        redirectTimeoutRef.current = null;
      }, 200);
      return;
    }

    router.replace(href);
  }, []);

  useEffect(() => {
    if (!user && !inAuthGroup && !isLoading) {
      safeRedirect("/(auth)/signin");
    }

    if (user && inAuthGroup && !isLoading) {
      safeRedirect("/(tabs)");
    }
  }, [user, inAuthGroup, isLoading, safeRedirect]);

  if (isLoading) {
    return (
      <Box flex={1} justify="center" align="center" bg="background">
        <ActivityIndicator size="large" color={colors.primary} />
      </Box>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
      <GestureHandlerRootView style={styles.gestureContainer}>
        <SafeAreaProvider>
          <SafeAreaView
            style={[styles.safeArea, { backgroundColor: colors.background }]}
            edges={["top", "left", "right"]}
          >
            {!netInfo.isConnected && <OfflineBanner />}

            {/* 1. 고정 헤더 (전역) */}
            {!inAuthGroup && segments[0] !== "schedule" && segments[1] !== "create" && (
              <Box 
                flexDir="row" 
                align="center" 
                justify="space-between" 
                px="xl" 
                py="lg"
              >
                <Box width={48} align="flex-start">
                  {router.canGoBack() && (
                    <TouchableOpacity 
                      activeOpacity={0.7} 
                      style={styles.headerIconBtn}
                      onPress={() => router.back()}
                    >
                      <IconSymbol
                        size={theme.layout.header.backIconSize}
                        name="chevron.left"
                        color={theme.colors.team.neutralDark}
                      />
                    </TouchableOpacity>
                  )}
                </Box>
                
                <Typography 
                  variant="h3" 
                  weight="black" 
                  color="brand.mint"
                  style={styles.headerTitle}
                >
                  YAGUNIV
                </Typography>
                
                <Box width={48} align="flex-end">
                  <TouchableOpacity 
                    activeOpacity={0.7} 
                    style={styles.headerIconBtn} 
                    onPress={() => router.push("/profile")}
                  >
                    <IconSymbol 
                      name="person.fill" 
                      size={theme.layout.header.profileIconSize} 
                      color={theme.colors.team.neutralDark} 
                    />
                  </TouchableOpacity>
                </Box>
              </Box>
            )}

            {/* 2. 하위 라우팅 화면 */}
            <Box flex={1} bg="background">
              <Stack
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: true,
                  animation: "slide_from_right",
                  fullScreenGestureEnabled: true,
                }}
              />
            </Box>
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  gestureContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerIconBtn: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.layout.header.titleFontSize,
    letterSpacing: 1,
  },
});

import { CombinedProvider } from '@/components/providers/combined-provider';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/src/styles/theme';
import { ErrorBoundaryFallback } from '@/src/components/shared/ErrorBoundaryFallback';
import { OfflineBanner } from '@/src/components/shared/OfflineBanner';
import { Logger } from '@/src/utils/logger';

import { Box, Toast, ConfirmModal } from '@/components/ui';
import { GlobalHeader } from '@/components/ui/global-header';
import { useNetInfo } from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import { Href, router, Stack, useSegments } from 'expo-router';
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useNotificationListeners } from '@/src/hooks/useNotificationListeners';
import Constants, { AppOwnership } from 'expo-constants';

/**
 * 전역 에러 핸들링 (React Native 환경)
 */
if (typeof ErrorUtils !== 'undefined') {
  const defaultHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    Logger.error('Unhandled Global Error', error, { context: { isFatal } });
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

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
    Logger.category('SYSTEM').warn('Notifications are not supported in this environment', e);
  }
}

/**
 * 루트 레이아웃
 * 전체 앱의 진입점
 */
export default function RootLayout() {
  useNotificationListeners();
  return (
    <GestureHandlerRootView style={styles.gestureContainer}>
      <CombinedProvider>
        <RootLayoutInner />
      </CombinedProvider>
    </GestureHandlerRootView>
  );
}

/**
 * 내부 레이아웃 컴포넌트
 */
function RootLayoutInner() {
  const { user, isLoading, isInitializing } = useAuth();
  const { colors } = useTheme();
  const segments = useSegments();
  const netInfo = useNetInfo();

  const inAuthGroup = segments[0] === '(auth)';

  const navigationReady = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      safeRedirect('/(auth)/signin');
    }

    if (user && inAuthGroup && !isLoading) {
      safeRedirect('/(tabs)');
    }
  }, [user, inAuthGroup, isLoading, safeRedirect]);

  const stackScreenOptions = useMemo(
    () => ({
      headerShown: false,
      gestureEnabled: true,
      animation: 'slide_from_right' as const,
      fullScreenGestureEnabled: true,
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: theme.colors.text.primary || theme.colors.primary,
      headerTitleStyle: { fontWeight: 'bold' as const },
    }),
    [colors],
  );

  if (isInitializing) {
    return (
      <Box flex={1} justify="center" align="center" bg="background">
        <ActivityIndicator size="large" color={colors.primary} />
      </Box>
    );
  }

  const dynamicBg = {
    backgroundColor: inAuthGroup ? theme.colors.transparent : colors.background,
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorBoundaryFallback}>
      <SafeAreaProvider>
        <View style={[styles.safeArea, dynamicBg]}>
          {!netInfo.isConnected ? <OfflineBanner /> : null}

          {/* 전역 헤더 */}
          <GlobalHeader withTopInset={true} />

          {/* 하위 라우팅 화면 */}
          <Box flex={1} style={dynamicBg}>
            <Stack screenOptions={stackScreenOptions} />
          </Box>
        </View>
        <Toast />
        <ConfirmModal />
      </SafeAreaProvider>
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
});

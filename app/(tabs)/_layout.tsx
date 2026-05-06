import { Tabs } from "expo-router";
import React, { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { AppState, AppStateStatus } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/useTheme";
import { theme } from "@/src/styles/theme";
import { useAuth } from "@/src/hooks/useAuth";
import { exchangeGetMyRequestsAPI } from "@/src/features/exchange/api";
import { Box } from "@/components/ui";

/**
 * 탭 네비게이션 레이아웃
 * 
 * Why: 앱의 주요 도메인 화면(홈, 라이브보드, 교환 등)을 하단 탭으로 구성.
 * Zero-Magic UI 원칙에 따라 배지 및 레이아웃을 Box 프리미티브로 관리함.
 */
export default function TabLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const { data: receiveResponse, refetch } = useQuery({
    queryKey: ["exchangeRequests", user?.userId, "receiver", "PENDING"],
    queryFn: () => exchangeGetMyRequestsAPI("receiver", 0, 1, "PENDING"),
    enabled: !!user?.userId,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        refetch();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refetch]);

  const hasNewExchangeRequest = (receiveResponse?.data?.totalElements ?? 0) > 0;

  const TAB_ICON_SIZE = 28;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={TAB_ICON_SIZE} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="liveboard"
        options={{
          title: "라이브보드",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={TAB_ICON_SIZE} name="chart.bar.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exchange"
        options={{
          title: "교환",
          tabBarIcon: ({ color }) => (
            <Box>
              <IconSymbol size={TAB_ICON_SIZE} name="arrow.left.arrow.right" color={color} />
              {hasNewExchangeRequest && (
                <Box 
                  position="absolute" 
                  right={theme.layout.tabBar.badgeOffset} 
                  top={theme.layout.tabBar.badgeOffset} 
                  width={theme.layout.tabBar.badgeSize} 
                  height={theme.layout.tabBar.badgeSize} 
                  rounded="sm" 
                  bg="error" 
                />
              )}
            </Box>
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: "예매알림",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={TAB_ICON_SIZE} name="bell.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "직관기록",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={TAB_ICON_SIZE} name="list.bullet" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// 🚨 앙드레 카파시: 모든 스타일을 Box 프리미티브로 이전함.

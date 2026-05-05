import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { View, StyleSheet, AppState, AppStateStatus } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/useTheme";
import { theme } from "@/src/styles/theme";
import { useAuth } from "@/src/hooks/useAuth";
import { exchangeGetMyRequestsAPI } from "@/src/features/exchange/api";

export default function TabLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      setAppState(nextAppState);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  const { data: receiveResponse } = useQuery({
    queryKey: ["exchangeRequests", "receiver", "PENDING"],
    queryFn: () => exchangeGetMyRequestsAPI("receiver", 0, 1, "PENDING"),
    enabled: !!user?.userId && appState === "active",
    refetchInterval: 30000,
  });

  const hasNewExchangeRequest = (receiveResponse?.data?.totalElements ?? 0) > 0;

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
            <IconSymbol size={28} name="location.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="liveboard"
        options={{
          title: "라이브보드",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="chart.bar.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exchange"
        options={{
          title: "교환",
          tabBarIcon: ({ color }) => (
            <View>
              <IconSymbol size={28} name="arrow.left.arrow.right" color={color} />
              {hasNewExchangeRequest && (
                <View style={styles.badge} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: "예매알림",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bell.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "직관기록",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: theme.layout.tabBar.badgeOffset,
    top: theme.layout.tabBar.badgeOffset,
    width: theme.layout.tabBar.badgeSize,
    height: theme.layout.tabBar.badgeSize,
    borderRadius: theme.layout.tabBar.badgeRadius,
    backgroundColor: theme.colors.error,
  },
});

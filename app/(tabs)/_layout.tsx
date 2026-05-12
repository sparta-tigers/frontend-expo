import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/useTheme";
export default function TabLayout() {
  const { colors } = useTheme();

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

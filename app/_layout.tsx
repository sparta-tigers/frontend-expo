import "fast-text-encoding";
import { useAuth } from "@/src/hooks/useAuth";
import { Redirect, Slot, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";

/**
 * 루트 레이아웃
 * 전체 앱의 진입점
 */
export default function RootLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  const inAuthGroup = segments[0] === "(auth)";

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

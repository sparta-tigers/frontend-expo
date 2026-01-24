import "fast-text-encoding";
import { useAuth } from "@/src/hooks/useAuth";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

/**
 * 루트 레이아웃
 * 전체 앱의 진입점
 */
export default function RootLayout() {
  const { user, isLoading } = useAuth();

  // 로딩 중인 경우 ActivityIndicator 표시
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 로그인되지 않은 경우 로그인 페이지로
  if (!user) {
    return <Redirect href="/(auth)/signin" />;
  }

  return <Redirect href="/(tabs)" />;
}
